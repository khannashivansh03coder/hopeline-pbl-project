#ifndef PATIENT_H
#define PATIENT_H

#include <string>

using namespace std;

class Patient
{
private:
    int patientId;
    string name;
    int age;
    string bloodGroup;

    int severity;
    int riskLevel;
    int waitingTime;

    string requiredResource;
    string bloodRequired;

public:
    Patient(int id, string n, int a, string bg,
            int s, int r, int wait,
            string resource, string blood);

    int getPatientId() const;
    string getName() const;
    int getAge() const;
    string getBloodGroup() const;

    int getSeverity() const;
    int getRiskLevel() const;
    int getWaitingTime() const;

    string getRequiredResource() const;
    string getBloodRequired() const;

    void increaseWaitingTime(int minutes);

    void display() const;
};

#endif