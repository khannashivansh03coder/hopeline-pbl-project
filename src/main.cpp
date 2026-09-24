#include <iostream>
#include <vector>
#include <limits>
#include "../include/Patient.h"
#include "../include/PriorityEngine.h"
#include "../include/PriorityQueue.h"

using namespace std;

void registerPatient(vector<Patient>& patients,
                     PriorityQueue& emergencyQueue)
{
    int id;
    string name;
    int age;
    string bloodGroup;
    int severity;
    int riskLevel;
    string requiredResource;
    string bloodRequired;

    cout << "\n====================================\n";
    cout << "        PATIENT REGISTRATION\n";
    cout << "====================================\n";

    cout << "Enter Patient ID: ";
    cin >> id;

    cin.ignore(numeric_limits<streamsize>::max(), '\n');

    cout << "Enter Patient Name: ";
    getline(cin, name);

    cout << "Enter Age: ";
    cin >> age;

    cout << "Enter Blood Group: ";
    cin >> bloodGroup;

    cout << "Enter Severity (1-10): ";
    cin >> severity;

    cout << "Enter Risk Level (1-10): ";
    cin >> riskLevel;

    cin.ignore(numeric_limits<streamsize>::max(), '\n');

    cout << "Enter Required Resource (ICU/GENERAL/OXYGEN): ";
    getline(cin, requiredResource);

    char choice;

    cout << "Does patient require blood? (Y/N): ";
    cin >> choice;

    if (choice == 'Y' || choice == 'y')
    {
        cout << "Enter Required Blood Group: ";
        cin >> bloodRequired;
    }
    else
    {
        bloodRequired = "NONE";
    }

    Patient newPatient(
        id,
        name,
        age,
        bloodGroup,
        severity,
        riskLevel,
        0,
        requiredResource,
        bloodRequired
    );

    patients.push_back(newPatient);

    emergencyQueue.enqueue(newPatient);

    cout << "\nPatient registered successfully!\n";

    newPatient.display();

    PriorityEngine priorityEngine;

    cout << "Priority Score    : "
         << priorityEngine.calculatePriority(newPatient)
         << endl;

    cout << "\nPatient added to Emergency Priority Queue.\n";
}

void viewPatients(const vector<Patient>& patients,
                  PriorityEngine& priorityEngine)
{
    if (patients.empty())
    {
        cout << "\nNo patients registered yet.\n";
        return;
    }

    cout << "\n====================================\n";
    cout << "       REGISTERED PATIENTS\n";
    cout << "====================================\n";

    for (int i = 0; i < patients.size(); i++)
    {
        patients[i].display();

        cout << "Priority Score    : "
             << priorityEngine.calculatePriority(patients[i])
             << endl;
    }
}

int main()
{
    vector<Patient> patients;

    PriorityEngine priorityEngine;
    PriorityQueue emergencyQueue;

    int choice;

    do
    {
        cout << "\n\n====================================\n";
        cout << "             HOPELINE\n";
        cout << "====================================\n";
        cout << "       HOSPITAL STAFF MENU\n";
        cout << "====================================\n";
        cout << "1. Register New Patient\n";
        cout << "2. View Registered Patients\n";
        cout << "3. View Emergency Priority Queue\n";
        cout << "4. Process Highest Priority Patient\n";
        cout << "5. Exit\n";
        cout << "====================================\n";

        cout << "Enter your choice: ";
        cin >> choice;

        switch (choice)
        {
        case 1:
            registerPatient(patients, emergencyQueue);
            break;

        case 2:
            viewPatients(patients, priorityEngine);
            break;

        case 3:
            emergencyQueue.display();
            break;

        case 4:
        {
            if (emergencyQueue.isEmpty())
            {
                cout << "\nNo patients in the priority queue.\n";
            }
            else
            {
                Patient nextPatient = emergencyQueue.dequeue();

                cout << "\n====================================\n";
                cout << "     HIGHEST PRIORITY PATIENT\n";
                cout << "====================================\n";

                nextPatient.display();

                cout << "Priority Score    : "
                     << priorityEngine.calculatePriority(nextPatient)
                     << endl;

                cout << "\nPatient selected for next processing.\n";
            }

            break;
        }

        case 5:
            cout << "\nExiting HopeLine...\n";
            break;

        default:
            cout << "\nInvalid choice. Please try again.\n";
        }

    } while (choice != 5);

    return 0;
}