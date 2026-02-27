import { motion } from "framer-motion";
import { format } from "date-fns";
import { User2, Coins, UserPlus, Calendar, Clock, MoreHorizontal } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Address } from "@/components/ui/Address";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TaskView, UserTaskStatus } from "@/types/types";
import { formatUnits } from "viem";

interface TaskListItemProps {
    task: TaskView;
    address?: `0x${string}`;
    userProfiles: Record<string, { nickname: string; avatar: string }>;
    isCreator: boolean;
    isMember: boolean;
    statusInfo: {
        isSubmitted: boolean;
        status: number;
        reviewComment: string;
    };
    timeInfo: {
        isExpired: boolean;
        remainingTime: number;
        days: number;
        hours: number;
        minutes: number;
        seconds: number;
    };
    onTaskSelect: (task: TaskView) => void;
    onOpenSubmitProofModal: (task: TaskView) => void;
    onOpenAddReviewerModal: (taskId: bigint) => void;
    onOpenUpdateTaskModal: (taskId: bigint) => void;
    onCancelTask: (taskId: bigint) => void;
    onSelfCheck: (task: TaskView) => void;
}

export default function TaskListItem({
    task,
    address,
    userProfiles,
    isCreator,
    isMember,
    statusInfo,
    timeInfo,
    onTaskSelect,
    onOpenSubmitProofModal,
    onOpenAddReviewerModal,
    onOpenUpdateTaskModal,
    onCancelTask,
    onSelfCheck,
}: TaskListItemProps) {
    const { isExpired, days, hours, minutes, seconds } = timeInfo;

    return (
        <motion.li
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={cn(
                "relative bg-white rounded-xl border-y border-r border-slate-200 p-6 shadow-sm transform transition hover:-translate-y-1 group hover:shadow-md",
                task.completed
                    ? "border-l-4 border-l-green-500 opacity-75"
                    : task.cancelled
                        ? "border-l-4 border-l-slate-300 opacity-60"
                        : "border-l-4 border-l-blue-600 border-l-primary"
            )}
        >
            {/* Actions Dropdown */}
            {address && isMember && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                        >
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {/* Submit Proof - Only displayed when not submitted or rejected */}
                        {address && (!statusInfo.isSubmitted || statusInfo.status !== 1) && (
                            <DropdownMenuItem onClick={() => onOpenSubmitProofModal(task)}>
                                Submit Proof
                            </DropdownMenuItem>
                        )}

                        {/* Creator Actions */}
                        {isCreator && (
                            <>
                                <DropdownMenuItem onClick={() => onOpenAddReviewerModal(task.id)}>
                                    Add Reviewer
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onOpenUpdateTaskModal(task.id)}>
                                    Update Task
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onCancelTask(task.id)}>
                                    Cancel Task
                                </DropdownMenuItem>
                            </>
                        )}

                        {/* Self Check - Only display when submitted but not yet reviewed */}
                        {task.allowSelfCheck && statusInfo.isSubmitted && statusInfo.status === 0 && (
                            <DropdownMenuItem onClick={() => onSelfCheck(task)}>
                                Self Check
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            )}

            {/* Task Details */}
            <div className="flex items-start cursor-pointer" onClick={() => onTaskSelect(task)}>
                <div className="space-y-3 w-full">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {task.name}
                        </h3>
                        <p className="mt-1 text-sm text-slate-500 max-w-2xl line-clamp-2">
                            {task.description}
                        </p>
                    </div>

                    {/* Task Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-3 gap-x-6 mt-4">
                        <div className="flex items-center gap-2 text-slate-500 text-sm">
                            <User2 className="h-4 w-4 text-slate-400" />
                            <span className="text-slate-400">Creator:</span>
                            <div className="relative w-4 h-4 flex-shrink-0">
                                {userProfiles && task?.creator && userProfiles[task.creator.toLowerCase()]?.avatar ? (
                                    <Image
                                        src={userProfiles[task.creator.toLowerCase()].avatar}
                                        alt="Creator avatar"
                                        fill
                                        className="rounded-full object-cover"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.src = "/placeholder.png";
                                        }}
                                    />
                                ) : (
                                    <User2 className="w-4 h-4" />
                                )}
                            </div>
                            <span>
                                {userProfiles[task.creator.toLowerCase()]?.nickname || (
                                    <Address address={task.creator} size="sm" />
                                )}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500 text-sm">
                            <Coins className="h-4 w-4 text-slate-400" />
                            <span className="font-semibold text-slate-700">
                                Reward: {formatUnits(task.rewardAmount, 18)}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500 text-sm">
                            <UserPlus className="h-4 w-4 text-slate-400" />
                            <span>
                                {Number(task.numCompletions)} / {Number(task.maxCompletions)} Completions
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500 text-sm">
                            <Calendar className="h-4 w-4 text-slate-400" />
                            <span>{format(new Date(Number(task.createdAt) * 1000), "MMM d, yyyy")}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500 text-sm">
                            <Clock className="h-4 w-4 text-slate-400" />
                            <span>Due: {format(new Date(Number(task.deadline)), "MMM d, yyyy")}</span>
                        </div>
                    </div>

                    {/* Action Area / Details */}
                    {address && statusInfo.isSubmitted && statusInfo.status === 1 ? (
                        <div className="bg-slate-50 rounded-lg p-4 border border-slate-100 mt-4">
                            <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                                Approved submission
                            </div>
                        </div>
                    ) : null}

                    {address &&
                        (!statusInfo.isSubmitted || statusInfo.status !== 1) &&
                        !task.cancelled &&
                        !task.completed &&
                        !isExpired && (
                            <div className="bg-slate-50 rounded-lg p-5 border border-dashed border-slate-300 mt-6 lg:w-2/3">
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <Button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onOpenSubmitProofModal(task);
                                        }}
                                        className="bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all flex items-center gap-2"
                                    >
                                        Submit Deliverable
                                        <span className="material-symbols-outlined text-[16px]">send</span>
                                    </Button>
                                </div>
                            </div>
                        )}

                    {/* Countdown and Status */}
                    <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-100">
                        {/* Status Badges */}
                        <div className="flex gap-2">
                            {task.cancelled && (
                                <Badge variant="destructive" className="bg-slate-100 text-slate-500 border-none shadow-none">
                                    Cancelled
                                </Badge>
                            )}
                            {task.completed && (
                                <Badge className="bg-green-50 text-green-600 border border-green-100 shadow-none hover:bg-green-50">
                                    Completed
                                </Badge>
                            )}
                            {statusInfo.isSubmitted && (
                                <Badge
                                    variant={
                                        statusInfo.status === 1 ? "success" : statusInfo.status === -1 ? "destructive" : "default"
                                    }
                                    className={cn(
                                        "shadow-none border-none",
                                        statusInfo.status === 1 && "bg-green-100 text-green-700",
                                        statusInfo.status === -1 && "bg-red-50 text-red-600 border border-red-100",
                                        statusInfo.status === 0 && "bg-blue-50 text-blue-600 border border-blue-100"
                                    )}
                                >
                                    {statusInfo.status === 1 ? "Approved" : statusInfo.status === -1 ? "Rejected" : "Pending Review"}
                                </Badge>
                            )}
                        </div>

                        {/* Countdown Timer */}
                        {!task.cancelled && !task.completed && (
                            isExpired ? (
                                <Badge variant="destructive" className="bg-red-50 text-red-600 border-none shadow-none">
                                    Expired
                                </Badge>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.5, ease: "easeInOut" }}
                                    className="text-sm font-medium text-slate-500 bg-slate-50 px-3 py-1 rounded-full border border-slate-100 flex items-center gap-1"
                                >
                                    <span className="material-symbols-outlined text-[14px]">timer</span>
                                    {days}d {hours}h {minutes}m {seconds}s
                                </motion.div>
                            )
                        )}
                    </div>
                </div>
            </div>
        </motion.li>
    );
}
