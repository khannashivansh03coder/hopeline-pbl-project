#include "../include/PriorityEngine.h"

int PriorityEngine::calculatePriority(const Patient& patient) const
{
    int severity = patient.getSeverity();
    int risk = patient.getRiskLevel();
    int waitingTime = patient.getWaitingTime();

    int waitingScore = waitingTime / 5;

    if (waitingScore > 10)
    {
        waitingScore = 10;
    }

    int priority = (severity * 5)
                 + (risk * 3)
                 + (waitingScore * 2);

    return priority;
}