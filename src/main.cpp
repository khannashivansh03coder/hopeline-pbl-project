#include <iostream>
#include <vector>
#include <limits>
#include <memory>
#include <string>

#include "../include/Patient.h"
#include "../include/PriorityEngine.h"
#include "../include/PriorityQueue.h"

#include "../include/Donor.h"
#include "../include/DonorHashTable.h"
#include "../include/DonorMatching.h"

#include "../modules/parikshit/Hospital.h"
#include "../modules/parikshit/Resource.h"

using namespace std;


// ============================================================
// FIND AVAILABLE RESOURCE
// ============================================================

Resource* findAvailableResource(Hospital& hospital,
                                 const string& requiredResource)
{
    vector<int> resourceIds;

    if (requiredResource == "ICU" ||
        requiredResource == "icu" ||
        requiredResource == "Icu")
    {
        resourceIds = {1, 2, 3, 4, 5};
    }
    else if (requiredResource == "GENERAL" ||
             requiredResource == "general" ||
             requiredResource == "General")
    {
        resourceIds = {6, 7, 8, 9, 10};
    }
    else if (requiredResource == "OXYGEN" ||
             requiredResource == "oxygen" ||
             requiredResource == "Oxygen")
    {
        resourceIds = {11, 12, 13, 14, 15};
    }
    else
    {
        return nullptr;
    }

    for (int id : resourceIds)
    {
        Resource* resource = hospital.findResource(id);

        if (resource != nullptr &&
            resource->getState() == ResourceState::AVAILABLE)
        {
            return resource;
        }
    }

    return nullptr;
}


// ============================================================
// REGISTER PATIENT
// ============================================================

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

    cout << "Priority Score : "
         << priorityEngine.calculatePriority(newPatient)
         << endl;

    cout << "\nPatient added to Emergency Priority Queue.\n";
}


// ============================================================
// VIEW PATIENTS
// ============================================================

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

    for (const Patient& patient : patients)
    {
        patient.display();

        cout << "Priority Score : "
             << priorityEngine.calculatePriority(patient)
             << endl;

        cout << "------------------------------------\n";
    }
}


// ============================================================
// CREATE SAMPLE HOSPITAL RESOURCES
// ============================================================

void setupHospital(Hospital& hospital)
{
    hospital.addResource(
        make_unique<ICUBed>(1)
    );

    hospital.addResource(
        make_unique<ICUBed>(2)
    );

    hospital.addResource(
        make_unique<ICUBed>(3)
    );

    hospital.addResource(
        make_unique<ICUBed>(4)
    );

    hospital.addResource(
        make_unique<ICUBed>(5)
    );

    hospital.addResource(
        make_unique<GeneralBed>(6)
    );

    hospital.addResource(
        make_unique<GeneralBed>(7)
    );

    hospital.addResource(
        make_unique<GeneralBed>(8)
    );

    hospital.addResource(
        make_unique<GeneralBed>(9)
    );

    hospital.addResource(
        make_unique<GeneralBed>(10)
    );

    hospital.addResource(
        make_unique<OxygenUnit>(11)
    );

    hospital.addResource(
        make_unique<OxygenUnit>(12)
    );

    hospital.addResource(
        make_unique<OxygenUnit>(13)
    );

    hospital.addResource(
        make_unique<OxygenUnit>(14)
    );

    hospital.addResource(
        make_unique<OxygenUnit>(15)
    );
}


// ============================================================
// CREATE SAMPLE DONORS
// ============================================================

void setupDonors(DonorHashTable& donorTable)
{
    Donor donor1(
        "D101",
        "Ravi",
        "O+",
        true,
        5,
        "2026-06-01"
    );

    Donor donor2(
        "D102",
        "Amit",
        "O-",
        true,
        25,
        "2026-06-15"
    );

    Donor donor3(
        "D103",
        "Kunal",
        "A+",
        true,
        8,
        "2026-07-01"
    );

    Donor donor4(
        "D104",
        "Arjun",
        "B+",
        true,
        3,
        "2026-05-01"
    );

    Donor donor5(
        "D105",
        "Neeraj",
        "O-",
        false,
        2,
        "2026-04-01"
    );

    donorTable.insert(donor1);
    donorTable.insert(donor2);
    donorTable.insert(donor3);
    donorTable.insert(donor4);
    donorTable.insert(donor5);
}


// ============================================================
// FIND BEST DONOR FOR PATIENT
// ============================================================

void findBloodDonor(const Patient& patient,
                    const DonorHashTable& donorTable,
                    PriorityEngine& priorityEngine)
{
    string bloodGroup = patient.getBloodRequired();

    if (bloodGroup == "NONE")
    {
        cout << "\nThis patient does not require blood.\n";
        return;
    }

    int priority =
        priorityEngine.calculatePriority(patient);

    DonorMatching matchingEngine;

    Donor bestDonor;

    int bestScore = 0;

    bool found =
        matchingEngine.findBestDonor(
            donorTable,
            bloodGroup,
            priority,
            bestDonor,
            bestScore
        );

    cout << "\n====================================\n";
    cout << "         BLOOD DONOR MATCH\n";
    cout << "====================================\n";

    cout << "Required Blood Group : "
         << bloodGroup << endl;

    cout << "Patient Priority     : "
         << priority << endl;

    if (found)
    {
        cout << "\nBest Donor Found\n";
        cout << "------------------------------------\n";

        bestDonor.display();

        cout << "Matching Score       : "
             << bestScore << endl;
    }
    else
    {
        cout << "\nNo suitable donor found.\n";
    }
}


// ============================================================
// PROCESS HIGHEST PRIORITY PATIENT
// ============================================================

void processHighestPriorityPatient(
    PriorityQueue& emergencyQueue,
    Hospital& hospital,
    const DonorHashTable& donorTable,
    PriorityEngine& priorityEngine)
{
    if (emergencyQueue.isEmpty())
    {
        cout << "\nNo patients in the priority queue.\n";
        return;
    }

    Patient patient =
        emergencyQueue.dequeue();

    cout << "\n====================================\n";
    cout << "     HIGHEST PRIORITY PATIENT\n";
    cout << "====================================\n";

    patient.display();

    int priority =
        priorityEngine.calculatePriority(patient);

    cout << "Priority Score : "
         << priority << endl;

    cout << "\n---------- RESOURCE ALLOCATION ----------\n";

    Resource* resource =
        findAvailableResource(
            hospital,
            patient.getRequiredResource()
        );

    if (resource != nullptr)
    {
        cout << "Required Resource : "
             << patient.getRequiredResource()
             << endl;

        cout << "Resource Allocated : "
             << resource->getType()
             << endl;

        cout << "Resource ID        : "
             << resource->getId()
             << endl;

        hospital.allocateResource(
            resource->getId()
        );

        cout << "Status             : Allocated\n";
    }
    else
    {
        cout << "No "
             << patient.getRequiredResource()
             << " resource is currently available.\n";

        cout << "Patient needs to wait for a resource.\n";
    }

    cout << "\n---------- BLOOD REQUIREMENT ----------\n";

    if (patient.getBloodRequired() == "NONE")
    {
        cout << "Blood Required : No\n";
    }
    else
    {
        cout << "Blood Required : Yes\n";

        findBloodDonor(
            patient,
            donorTable,
            priorityEngine
        );
    }

    cout << "\n====================================\n";
    cout << "       PATIENT PROCESSING DONE\n";
    cout << "====================================\n";
}


// ============================================================
// MAIN
// ============================================================

int main()
{
    vector<Patient> patients;

    PriorityEngine priorityEngine;

    PriorityQueue emergencyQueue;

    Hospital hospital("HopeLine Hospital");

    DonorHashTable donorTable(10);

    setupHospital(hospital);

    setupDonors(donorTable);

    int choice;

    do
    {
        cout << "\n\n====================================\n";
        cout << "            HOPELINE\n";
        cout << " SMART HOSPITAL RESOURCE SYSTEM\n";
        cout << "====================================\n";

        cout << "1. Register New Patient\n";
        cout << "2. View Registered Patients\n";
        cout << "3. View Emergency Priority Queue\n";
        cout << "4. Process Highest Priority Patient\n";
        cout << "5. View Hospital Resources\n";
        cout << "6. View Donor Database\n";
        cout << "7. Find Best Blood Donor\n";
        cout << "8. Exit\n";

        cout << "====================================\n";
        cout << "Enter your choice: ";

        cin >> choice;

        switch (choice)
        {
            case 1:
            {
                registerPatient(
                    patients,
                    emergencyQueue
                );

                break;
            }

            case 2:
            {
                viewPatients(
                    patients,
                    priorityEngine
                );

                break;
            }

            case 3:
            {
                emergencyQueue.display();

                break;
            }

            case 4:
            {
                processHighestPriorityPatient(
                    emergencyQueue,
                    hospital,
                    donorTable,
                    priorityEngine
                );

                break;
            }

            case 5:
            {
                hospital.displayResources();

                break;
            }

            case 6:
            {
                donorTable.display();

                break;
            }

            case 7:
            {
                if (patients.empty())
                {
                    cout << "\nNo patients registered yet.\n";
                    break;
                }

                int patientIndex;

                cout << "\nEnter patient number (1-"
                     << patients.size()
                     << "): ";

                cin >> patientIndex;

                if (patientIndex < 1 ||
                    patientIndex > patients.size())
                {
                    cout << "\nInvalid patient number.\n";
                    break;
                }

                findBloodDonor(
                    patients[patientIndex - 1],
                    donorTable,
                    priorityEngine
                );

                break;
            }

            case 8:
            {
                cout << "\nExiting HopeLine...\n";
                break;
            }

            default:
            {
                cout << "\nInvalid choice. Please try again.\n";
            }
        }

    } while (choice != 8);

    return 0;
}
