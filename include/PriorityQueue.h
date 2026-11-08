#ifndef PRIORITY_QUEUE_H
#define PRIORITY_QUEUE_H

#include <vector>
#include "Patient.h"
#include "PriorityEngine.h"

using namespace std;

class PriorityQueue
{
private:
    vector<Patient> heap;
    PriorityEngine priorityEngine;

    void heapifyUp(int index);
    void heapifyDown(int index);

public:
    void enqueue(const Patient& patient);
    void refresh();
    Patient dequeue();
    Patient peek() const;

    bool isEmpty() const;
    int size() const;

    bool removeByPatientId(int patientId);

    void display() const;
};

#endif