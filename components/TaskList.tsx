"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Calendar,
  Clock,
  Coins,
  MoreHorizontal,
  User2,
  UserPlus,
} from "lucide-react";
import { format } from "date-fns";
import { Address } from "./ui/Address";
import { Chain, formatUnits } from "viem";
import {
  TaskView,
  SubmissionProof,
  UserTaskStatus,
  BoardConfig,
} from "@/types/types";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "./ui/badge";
import UploadProofModal from "./UploadProofModal";
import { useSubmitProof, useSelfCheckSubmission } from "@/hooks/useContract";
import { useToast } from "./ui/use-toast";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { modalConfigs } from "@/app/board/[id]/page";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import TaskListItem from "./TaskListItem";
interface TaskListProps {
  boardId: bigint;
  boardConfig: BoardConfig;
  tasks: TaskView[];
  userTaskStatuses: UserTaskStatus[];
  address: `0x${string}` | undefined;
  chain: Chain;
  onTaskSelect: (task: TaskView) => void;
  onOpenSubmitProofModal: (taskId: bigint) => void;
  onOpenAddReviewerModal: (taskId: bigint) => void;
  onOpenUpdateTaskModal: (taskId: bigint) => void;
  onCancelTask: (taskId: bigint) => void;
  refetch: () => void;
  userProfiles: Record<string, { nickname: string; avatar: string }>;
  isCreator: boolean;
  isMember: boolean;
  onOpenModal: (type: keyof typeof modalConfigs, taskId?: bigint) => void;
  onUpdateTask: (taskId: bigint) => void;
  isWalletConnected: boolean;
}

export default function TaskList({
  boardId,
  boardConfig,
  tasks,
  userTaskStatuses,
  address,
  onTaskSelect,
  onOpenSubmitProofModal,
  onOpenAddReviewerModal,
  onOpenUpdateTaskModal,
  onCancelTask,
  refetch,
  chain,
  userProfiles = {}, // Add default empty object
  isCreator: isCreatorProp,
  isMember,
  onOpenModal,
  onUpdateTask,
  isWalletConnected,
}: TaskListProps) {
  const { toast } = useToast();
  const selfCheckSubmission = useSelfCheckSubmission();

  const [customDeadlines, setCustomDeadlines] = useState<
    Record<number, number>
  >({});

  const [remainingTimes, setRemainingTimes] = useState<Record<number, number>>(
    tasks.reduce(
      (acc, task) => ({
        ...acc,
        [Number(task.id)]: Number(task.deadline) * 1000 - Date.now(),
      }),
      {}
    )
  );

  useEffect(() => {
    const intervalId = setInterval(() => {
      setRemainingTimes((prevTimes) =>
        tasks.reduce(
          (acc, task) => ({
            ...acc,
            [Number(task.id)]:
              customDeadlines[Number(task.id)] ||
              Number(task.deadline) * 1000 - Date.now(),
          }),
          {}
        )
      );
    }, 1000);
    return () => clearInterval(intervalId);
  }, [tasks, customDeadlines]);

  const [isSubmitProofModalOpen, setIsSubmitProofModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskView | null>(null);

  const handleOpenSubmitProof = (task: TaskView) => {
    setSelectedTask(task);
    setIsSubmitProofModalOpen(true);
  };

  const submitProof = useSubmitProof();

  async function onSubmitProof(fileUrl: string) {
    if (!selectedTask) return;

    const proofString = JSON.stringify({ fileUrl });

    try {
      await submitProof({
        boardId,
        taskId: selectedTask.id,
        proof: proofString,
      });
    } catch (error) {
      console.error("Error submitting proof:", error);
      throw error;
    }
  }

  const [selfCheckResult, setSelfCheckResult] = useState<{
    isOpen: boolean;
    success: boolean;
    message: string;
    taskId?: bigint;
    signature?: string;
    comment?: string;
  }>({
    isOpen: false,
    success: false,
    message: "",
  });

  const handleSelfCheck = async (task: TaskView) => {
    try {
      const waitToast = toast({
        title: "Processing",
        description: (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
            <span>Verifying your submission...</span>
          </div>
        ),
        duration: Infinity,
      });

      // Verify required parameters
      if (
        !address ||
        !chain ||
        task.completed ||
        task.cancelled ||
        (task.deadline && Number(task.deadline) * 1000 < Date.now())
      ) {
        clearTimeout(waitToast.id);
        setSelfCheckResult({
          isOpen: true,
          success: false,
          message: !address
            ? "Please connect your wallet"
            : !chain
              ? "Chain not found"
              : task.completed
                ? "Task is already completed"
                : task.cancelled
                  ? "Task is cancelled"
                  : "Task deadline has passed",
        });
        return;
      }

      // Get the submission proof of the current task
      const currentSubmission = userTaskStatuses.find(
        (status) => status.taskId === task.id
      );

      if (!currentSubmission?.submitProof) {
        clearTimeout(waitToast.id);
        setSelfCheckResult({
          isOpen: true,
          success: false,
          message: "No submission found",
        });
        return;
      }

      // Parse the submitted proof data
      const submissionProof = JSON.parse(currentSubmission.submitProof);

      const taskJson = {
        id: task.id.toString(),
        name: task.name,
        description: task.description,
        rewardAmount: task.rewardAmount.toString(),
        numCompletions: task.numCompletions.toString(),
        maxCompletions: task.maxCompletions.toString(),
        createdAt: task.createdAt.toString(),
        deadline: task.deadline.toString(),
        allowSelfCheck: task.allowSelfCheck,
        reviewers: task.reviewers,
        config: JSON.parse(task.config || "{}"),
      };

      const response = await fetch("/api/self-check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          boardId: boardId.toString(),
          boardConfig,
          taskId: task.id.toString(),
          address,
          proof: currentSubmission.submitProof,
          chainName: chain.name,
          task: taskJson,
        }),
      });

      const data = await response.json();

      clearTimeout(waitToast.id);

      if (data.error) {
        setSelfCheckResult({
          isOpen: true,
          success: false,
          message: "Failed to complete self check",
          taskId: task.id,
          comment: data.error,
        });
        toast({
          title: "Error",
          description: "Failed to complete self check",
          variant: "destructive",
          duration: 1000,
        });
        return;
      }

      setSelfCheckResult({
        isOpen: true,
        success: data.signature ? true : false,
        message: data.signature
          ? "Verification successful! You can now claim your reward."
          : "Verification failed",
        taskId: task.id,
        signature: data.signature,
        comment: data.checkData,
      });
    } catch (error) {
      console.error("Self check error:", error);
      toast({
        title: "Error",
        description: "Failed to complete self check",
        variant: "destructive",
      });
      setSelfCheckResult({
        isOpen: true,
        success: false,
        message: "Failed to complete self check",
      });
    }
  };

  const handleClaim = async () => {
    if (
      selfCheckResult.taskId === undefined ||
      !selfCheckResult.signature ||
      !selfCheckResult.comment
    )
      return;

    try {
      const tx = await selfCheckSubmission({
        boardId,
        taskId: selfCheckResult.taskId,
        signature: selfCheckResult.signature as `0x${string}`,
        checkData: selfCheckResult.comment,
      });

      if (tx.error) {
        setSelfCheckResult({
          isOpen: true,
          success: false,
          message: "Failed to claim reward",
        });
        return;
      }

      setSelfCheckResult((prev) => ({
        ...prev,
        isOpen: false,
      }));

      refetch();
    } catch (error) {
      setSelfCheckResult({
        isOpen: true,
        success: false,
        message: "Failed to claim reward",
      });
    }
  };

  const getTaskStatus = (task: TaskView) => {
    const status = userTaskStatuses.find((status) => status.taskId === task.id);
    return {
      isSubmitted: status?.submitted || false,
      status: status?.status || 0,
      reviewComment: status?.reviewComment || "",
    };
  };

  return (
    <>
      <ul className="space-y-4">
        {tasks.map((task) => {
          const isExpired = Date.now() > Number(task.deadline);
          const remainingTime = Number(task.deadline) - Date.now();
          const days = Math.floor(remainingTime / (1000 * 60 * 60 * 24));
          const hours = Math.floor(
            (remainingTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
          );
          const minutes = Math.floor(
            (remainingTime % (1000 * 60 * 60)) / (1000 * 60)
          );
          const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);

          const statusInfo = getTaskStatus(task);
          const timeInfo = {
            isExpired,
            remainingTime,
            days,
            hours,
            minutes,
            seconds,
          };

          return (
            <TaskListItem
              key={task.id}
              task={task}
              address={address}
              userProfiles={userProfiles}
              isCreator={isCreatorProp}
              isMember={isMember}
              statusInfo={statusInfo}
              timeInfo={timeInfo}
              onTaskSelect={onTaskSelect}
              onOpenSubmitProofModal={handleOpenSubmitProof}
              onOpenAddReviewerModal={onOpenAddReviewerModal}
              onOpenUpdateTaskModal={onOpenUpdateTaskModal}
              onCancelTask={onCancelTask}
              onSelfCheck={handleSelfCheck}
            />
          );
        })}
      </ul>

      {selectedTask && (
        <UploadProofModal
          isOpen={isSubmitProofModalOpen}
          onClose={() => {
            setIsSubmitProofModalOpen(false);
            setSelectedTask(null);
          }}
          onSubmit={async (fileUrl) => {
            await onSubmitProof(fileUrl);
            refetch();
          }}
        />
      )}

      {/* Self Check Result Modal */}
      {selfCheckResult.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg max-w-md w-full mx-4">
            <div className="flex flex-col items-center gap-4">
              {selfCheckResult.success ? (
                <>
                  <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-green-500"
                      fill="none"
                      strokeWidth="2"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">
                    Success!
                  </h3>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-red-500"
                      fill="none"
                      strokeWidth="2"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">
                    Error
                  </h3>
                </>
              )}

              <p className="text-center text-muted-foreground">
                {selfCheckResult.message}
              </p>

              {selfCheckResult.comment && (
                <>
                  <h3 className="text-sm text-muted-foreground text-left font-bold w-full">
                    Comment:
                  </h3>
                  <Textarea
                    value={selfCheckResult.comment}
                    className="w-full"
                    disabled
                  />
                </>
              )}

              <div className="flex gap-2 mt-4">
                {selfCheckResult.success ? (
                  <Button onClick={handleClaim}>Claim Reward</Button>
                ) : null}
                <Button
                  variant="outline"
                  onClick={() =>
                    setSelfCheckResult((prev) => ({ ...prev, isOpen: false }))
                  }
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
