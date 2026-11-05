#include "../include/PriorityQueue.h"
#include <iostream>
#include <stdexcept>

using namespace std;

void PriorityQueue::heapifyUp(int index)
{
    if (index == 0)
    {
        return;
    }

    int parent = (index - 1) / 2;

    int currentPriority =
        priorityEngine.calculatePriority(heap[index]);

    int parentPriority =
        priorityEngine.calculatePriority(heap[parent]);

    if (currentPriority > parentPriority)
    {
        swap(heap[index], heap[parent]);

        heapifyUp(parent);
    }
}

void PriorityQueue::heapifyDown(int index)
{
    int left = 2 * index + 1;
    int right = 2 * index + 2;

    int largest = index;

    if (left < heap.size())
    {
        int leftPriority =
            priorityEngine.calculatePriority(heap[left]);

        int largestPriority =
            priorityEngine.calculatePriority(heap[largest]);

        if (leftPriority > largestPriority)
        {
            largest = left;
        }
    }

    if (right < heap.size())
    {
        int rightPriority =
            priorityEngine.calculatePriority(heap[right]);

        int largestPriority =
            priorityEngine.calculatePriority(heap[largest]);

        if (rightPriority > largestPriority)
        {
            largest = right;
        }
    }

    if (largest != index)
    {
        swap(heap[index], heap[largest]);

        heapifyDown(largest);
    }
}

void PriorityQueue::enqueue(const Patient& patient)
{
    heap.push_back(patient);

    int lastIndex = heap.size() - 1;

    heapifyUp(lastIndex);
}

Patient PriorityQueue::dequeue()
{
    if (heap.empty())
    {
        throw runtime_error("Priority Queue is empty.");
    }

    Patient highestPriorityPatient = heap[0];

    heap[0] = heap.back();
    heap.pop_back();

    if (!heap.empty())
    {
        heapifyDown(0);
    }

    return highestPriorityPatient;
}

Patient PriorityQueue::peek() const
{
    if (heap.empty())
    {
        throw runtime_error("Priority Queue is empty.");
    }

    return heap[0];
}

bool PriorityQueue::isEmpty() const
{
    return heap.empty();
}

int PriorityQueue::size() const
{
    return heap.size();
}


bool PriorityQueue::removeByPatientId(int patientId)
{
    // Search for the patient by actual ID
    int index = -1;

    for (int i = 0; i < static_cast<int>(heap.size()); i++)
    {
        if (heap[i].getPatientId() == patientId)
        {
            index = i;
            break;
        }
    }

    // Patient not found in the queue
    if (index == -1)
    {
        return false;
    }

    // If it is the last element, simply remove it
    if (index == static_cast<int>(heap.size()) - 1)
    {
        heap.pop_back();
        return true;
    }

    // Replace the deleted element with the last element
    heap[index] = heap.back();
    heap.pop_back();

    // Restore the max-heap property
    if (index > 0)
    {
        int parent = (index - 1) / 2;

        int currentPriority =
            priorityEngine.calculatePriority(heap[index]);

        int parentPriority =
            priorityEngine.calculatePriority(heap[parent]);

        if (currentPriority > parentPriority)
        {
            heapifyUp(index);
            return true;
        }
    }

    heapifyDown(index);

    return true;
}


void PriorityQueue::display() const
{
    if (heap.empty())
    {
        cout << "\nPriority Queue is empty.\n";
        return;
    }

    cout << "\n====================================\n";
    cout << "        EMERGENCY PRIORITY QUEUE\n";
    cout << "====================================\n";

    for (int i = 0; i < heap.size(); i++)
    {
        cout << "Patient ID: "
             << heap[i].getPatientId()
             << " | Name: "
             << heap[i].getName()
             << " | Priority: "
             << priorityEngine.calculatePriority(heap[i])
             << endl;
    }

    cout << "====================================\n";
}