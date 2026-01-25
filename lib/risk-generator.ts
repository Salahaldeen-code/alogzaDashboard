import { prisma } from "@/lib/prisma";

// Helper function to calculate risk score (Severity × Probability)
function calculateRiskScore(severity: string, probability: string): number {
  const severityValues: Record<string, number> = {
    low: 1,
    medium: 2,
    high: 3,
    critical: 4,
  };
  const probabilityValues: Record<string, number> = {
    low: 1,
    medium: 2,
    high: 3,
  };
  return (severityValues[severity] || 2) * (probabilityValues[probability] || 2);
}

// Helper function to derive risk level from score
function deriveRiskLevel(score: number): "Low" | "Medium" | "High" {
  if (score <= 3) return "Low";
  if (score <= 6) return "Medium";
  return "High";
}

export async function autoGenerateRisksFromTasks() {
  try {
    const now = new Date();
    const oneDayFromNow = new Date(now);
    oneDayFromNow.setDate(oneDayFromNow.getDate() + 1);
    
    // Find all tasks with due dates <= 1 day from now and not completed
    const tasksAtRisk = await (prisma as any).task.findMany({
      where: {
        dueDate: {
          lte: oneDayFromNow,
        },
        status: {
          not: "done",
        },
      },
      include: {
        developer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const createdRisks = [];
    const updatedRisks = [];

    for (const task of tasksAtRisk) {
      if (!task.dueDate) continue;

      const dueDate = new Date(task.dueDate);
      const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const isOverdue = daysUntilDue < 0;

      // Determine severity based on how overdue or close to due date
      let severity: "low" | "medium" | "high" | "critical";
      let probability: "low" | "medium" | "high";
      
      if (isOverdue) {
        const daysOverdue = Math.abs(daysUntilDue);
        if (daysOverdue >= 7) {
          severity = "critical";
          probability = "high";
        } else if (daysOverdue >= 3) {
          severity = "high";
          probability = "high";
        } else {
          severity = "high";
          probability = "medium";
        }
      } else {
        // Due today or tomorrow
        if (daysUntilDue === 0) {
          severity = "high";
          probability = "high";
        } else {
          severity = "medium";
          probability = "medium";
        }
      }

      const riskTitle = `Task Deadline: ${task.title}${isOverdue ? " (OVERDUE)" : ""}`;
      const riskDescription = `Task "${task.title}" is ${isOverdue ? `${Math.abs(daysUntilDue)} day(s) overdue` : `due in ${daysUntilDue} day(s)`}.${task.description ? `\n\nTask Description: ${task.description}` : ""}${task.project ? `\n\nProject: ${task.project.name}` : ""}${task.developer ? `\n\nAssigned to: ${task.developer.name}` : ""}`;

      // Check if a risk already exists for this task (by checking title pattern)
      const existingRisk = await (prisma as any).risk.findFirst({
        where: {
          title: {
            startsWith: `Task Deadline: ${task.title}`,
          },
          category: "Task Deadline",
        },
      });

      const riskScore = calculateRiskScore(severity, probability);
      const riskLevel = deriveRiskLevel(riskScore);

      if (existingRisk) {
        // Update existing risk
        const updatedRisk = await (prisma as any).risk.update({
          where: { id: existingRisk.id },
          data: {
            title: riskTitle,
            description: riskDescription,
            severity,
            probability,
            riskScore,
            riskLevel,
            status: task.status === "done" ? "resolved" : existingRisk.status === "resolved" ? "identified" : existingRisk.status,
            updatedAt: new Date(),
          },
        });
        updatedRisks.push(updatedRisk);
      } else {
        // Create new risk
        const newRisk = await (prisma as any).risk.create({
          data: {
            projectId: task.projectId || null,
            title: riskTitle,
            description: riskDescription,
            category: "Task Deadline",
            severity,
            probability,
            riskScore,
            riskLevel,
            impact: `Task may not be completed on time, potentially affecting project timeline${task.project ? ` for ${task.project.name}` : ""}.`,
            mitigationPlan: `Review task status, reassign if necessary, or adjust timeline. Contact ${task.developer?.name || "assigned developer"} for status update.`,
            status: "identified",
            owner: task.developer?.name || null,
            identifiedDate: new Date(),
            targetResolutionDate: task.dueDate,
          },
        });
        createdRisks.push(newRisk);
      }
    }

    // Also check for completed tasks that have associated risks and mark them as resolved
    const completedTasks = await (prisma as any).task.findMany({
      where: {
        status: "done",
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    for (const task of completedTasks) {
      const associatedRisk = await (prisma as any).risk.findFirst({
        where: {
          title: {
            startsWith: `Task Deadline: ${task.title}`,
          },
          category: "Task Deadline",
          status: {
            not: "resolved",
          },
        },
      });

      if (associatedRisk) {
        await (prisma as any).risk.update({
          where: { id: associatedRisk.id },
          data: {
            status: "resolved",
            updatedAt: new Date(),
          },
        });
        updatedRisks.push(associatedRisk);
      }
    }

    return {
      success: true,
      created: createdRisks.length,
      updated: updatedRisks.length,
      message: `Generated ${createdRisks.length} new risks and updated ${updatedRisks.length} existing risks from task deadlines.`,
    };
  } catch (error: any) {
    console.error("Error auto-generating risks:", error);
    throw error;
  }
}

