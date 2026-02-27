// components/MemberSubmissionTable.tsx
"use client";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Check, X, Eye, Circle, CheckCircle, ExternalLink, User2 } from "lucide-react";
import {
  BoardDetailView,
  TaskView,
  SubmissionView,
} from "@/types/types";
import { Address } from "./ui/Address";
import { useState } from "react";
import SubmissionDetailsModal from "./SubmissionDetailsModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface MemberSubmissionTableProps {
  board: BoardDetailView;
  address: `0x${string}` | undefined;
  refetch: () => void;
  userProfiles: Record<string, { nickname: string; avatar: string; }>;
}

export default function MemberSubmissionTable({
  board,
  address,
  refetch,
  userProfiles,
}: MemberSubmissionTableProps) {
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionView | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<bigint | null>(null);
  const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskView | null>(null);

  const handleSubmissionClick = (submission: SubmissionView, task: TaskView) => {
    console.log(submission, task);

    if (submission.submitter !== "0x0000000000000000000000000000000000000000") {
      setSelectedSubmission(submission);
      setSelectedTask(task);
      setSelectedTaskId(task.id);
      setIsSubmissionModalOpen(true);
    }
  };

  const closeSubmissionModal = () => {
    setIsSubmissionModalOpen(false);
    setSelectedSubmission(null);
    setSelectedTask(null);
    setSelectedTaskId(null);
  };

  return (
    <>
      {/* Legend */}
      <div className="mb-6 p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
        <h4 className="text-sm font-semibold text-slate-900 mb-3">Status Legend</h4>
        <div className="flex flex-wrap gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Circle className="h-4 w-4 text-slate-300" />
            <span>Not Submitted</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-blue-500" />
            <span>Submitted</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500" />
            <span>Approved</span>
          </div>
          <div className="flex items-center gap-2">
            <X className="h-4 w-4 text-red-500" />
            <span>Rejected</span>
          </div>
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-yellow-500" />
            <span>Need Review</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden border-b-0 rounded-b-none">
        <Table>
          <TableHeader className="bg-slate-50 border-b border-slate-200">
            <TableRow className="hover:bg-slate-50">
              <TableCell className="font-semibold text-slate-700 h-10 w-fit whitespace-nowrap px-4 py-3">Member</TableCell>
              {board.tasks.map((task) => (
                <TableCell key={task.id} className="font-semibold text-slate-700 h-10 px-4 py-3">
                  {task.name}
                </TableCell>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {board.members.map((member, memberIndex) => (
              <TableRow key={member} className="hover:bg-slate-50 transition-colors duration-200 border-b border-slate-200">
                <TableCell className="font-medium text-slate-900 border-r border-slate-100">
                  <div className="flex items-center gap-2 w-max">
                    {userProfiles[member.toLowerCase()]?.avatar ? (
                      <Image
                        src={userProfiles[member.toLowerCase()].avatar}
                        alt="Member"
                        width={16}
                        height={16}
                        className="w-4 h-4 rounded-full"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "/placeholder.png";
                        }}
                      />
                    ) : (
                      <User2 className="h-4 w-4" />
                    )}
                    <span>
                      {userProfiles[member.toLowerCase()]?.nickname || (
                        <Address address={member} size="lg" />
                      )}
                    </span>
                  </div>
                </TableCell>
                {board.tasks.map((task, taskIndex) => {
                  const submission = board.submissions[taskIndex][memberIndex];
                  const isReviewer = task.reviewers.some(
                    (reviewer: `0x${string}`) => reviewer.toLowerCase() === address?.toLowerCase()
                  );

                  let icon = {
                    component: Circle,
                    className: "text-slate-200 hover:text-slate-300"
                  };

                  if (submission.submitter !== "0x0000000000000000000000000000000000000000") {
                    if (submission.status === 1) {
                      icon = {
                        component: Check,
                        className: "text-green-500 hover:text-green-600"
                      };
                    } else if (submission.status === -1) {
                      icon = {
                        component: X,
                        className: "text-red-500 hover:text-red-600"
                      };
                    } else if (isReviewer && submission.status === 0) {
                      icon = {
                        component: Eye,
                        className: "text-yellow-500 hover:text-yellow-600"
                      };
                    } else {
                      icon = {
                        component: CheckCircle,
                        className: "text-blue-500 hover:text-blue-600"
                      };
                    }
                  }

                  const IconComponent = icon.component;

                  return (
                    <TableCell key={task.id} className="text-center">
                      <div className="flex justify-center w-full">
                        <IconComponent
                          className={cn(
                            "h-5 w-5 cursor-pointer transition-colors duration-200",
                            icon.className
                          )}
                          onClick={() => handleSubmissionClick(submission, task)}
                        />
                      </div>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <SubmissionDetailsModal
        isOpen={isSubmissionModalOpen}
        onClose={closeSubmissionModal}
        submission={selectedSubmission}
        boardId={board.id}
        task={selectedTask}
        isReviewer={selectedTask?.reviewers.some(
          (reviewer: `0x${string}`) => reviewer.toLowerCase() === address?.toLowerCase()
        ) || false}
        onConfirmed={refetch}
      />
    </>
  );
}
