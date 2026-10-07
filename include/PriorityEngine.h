#ifndef PRIORITY_ENGINE_H
#define PRIORITY_ENGINE_H

#include "Patient.h"

class PriorityEngine
{
public:
    int calculatePriority(const Patient& patient) const;
};

#endif