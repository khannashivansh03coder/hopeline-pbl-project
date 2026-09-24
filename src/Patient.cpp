#include "../include/Patient.h"
#include <iostream>

using namespace std;

Patient::Patient(int id, string n, int a, string bg,
                 int s, int r, int wait,
                 string resource, string blood)
{
    patientId = id;
    name = n;
    age = a;
    bloodGroup = bg;

    severity = s;
    riskLevel = r;
    waitingTime = wait;

    requiredResource = resource;
    bloodRequired = blood;
}

int Patient::getPatientId() const
{
    return patientId;
}

string Patient::getName() const
{
    return name;
}

int Patient::getAge() const
{
    return age;
}

string Patient::getBloodGroup() const
{
    return bloodGroup;
}

int Patient::getSeverity() const
{
    return severity;
}

int Patient::getRiskLevel() const
{
    return riskLevel;
}

int Patient::getWaitingTime() const
{
    return waitingTime;
}

string Patient::getRequiredResource() const
{
    return requiredResource;
}

string Patient::getBloodRequired() const
{
    return bloodRequired;
}

void Patient::increaseWaitingTime(int minutes)
{
    waitingTime += minutes;
}

void Patient::display() const
{
    cout << "\n====================================\n";
    cout << "         PATIENT DETAILS\n";
    cout << "====================================\n";

    cout << "Patient ID        : " << patientId << endl;
    cout << "Name              : " << name << endl;
    cout << "Age               : " << age << endl;
    cout << "Blood Group       : " << bloodGroup << endl;
    cout << "Severity          : " << severity << "/10" << endl;
    cout << "Risk Level        : " << riskLevel << "/10" << endl;
    cout << "Waiting Time      : " << waitingTime << " minutes" << endl;
    cout << "Required Resource : " << requiredResource << endl;

    if (bloodRequired == "NONE")
    {
        cout << "Blood Required    : No" << endl;
    }
    else
    {
        cout << "Blood Required    : " << bloodRequired << endl;
    }

    cout << "====================================\n";
}