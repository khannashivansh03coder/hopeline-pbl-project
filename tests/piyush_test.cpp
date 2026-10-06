#include "../include/Donor.h"
#include "../include/BloodUnit.h"
#include "../include/DonorHashTable.h"
#include "../include/DonorMatching.h"

#include <iostream>
#include <vector>

using namespace std;


int main()
{
    cout << "=========================================\n";
    cout << "       HOPELINE - PIYUSH MODULE\n";
    cout << "=========================================\n";

    // ---------------------------------------
    // 1. Create Donors
    // ---------------------------------------

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

    // ---------------------------------------
    // 2. Create Hash Table
    // ---------------------------------------

    DonorHashTable donorTable(10);

    donorTable.insert(donor1);
    donorTable.insert(donor2);
    donorTable.insert(donor3);
    donorTable.insert(donor4);
    donorTable.insert(donor5);

    cout << "\nTotal donors inserted: "
         << donorTable.size() << endl;

    // ---------------------------------------
    // 3. Display Hash Table
    // ---------------------------------------

    donorTable.display();

    // ---------------------------------------
    // 4. Search Donors by Blood Group
    // ---------------------------------------

    cout << "\n========== SEARCH O- DONORS ==========\n";

    vector<Donor> oNegativeDonors =
        donorTable.searchByBloodGroup("O-");

    if (oNegativeDonors.empty())
    {
        cout << "No O- donors found.\n";
    }
    else
    {
        for (const Donor& donor : oNegativeDonors)
        {
            donor.display();
            cout << "-------------------------------------\n";
        }
    }

    // ---------------------------------------
    // 5. Create Blood Unit
    // ---------------------------------------

    BloodUnit unit1(
        "BU101",
        "O+",
        "2026-10-10",
        "Available"
    );

    cout << "\n========== BLOOD UNIT ==========\n";

    unit1.display();

    // ---------------------------------------
    // 6. Find Best Donor
    // ---------------------------------------

    DonorMatching matchingEngine;

    Donor bestDonor;
    int bestScore;

    string patientBloodGroup = "O+";
    int urgencyScore = 90;

    bool found = matchingEngine.findBestDonor(
        donorTable,
        patientBloodGroup,
        urgencyScore,
        bestDonor,
        bestScore
    );

    cout << "\n========== BEST DONOR MATCH ==========\n";

    if (found)
    {
        cout << "Patient Blood Group : "
             << patientBloodGroup << endl;

        cout << "Urgency Score       : "
             << urgencyScore << endl;

        cout << "Best Match Score    : "
             << bestScore << endl;

        cout << "\nSelected Donor:\n";

        bestDonor.display();
    }
    else
    {
        cout << "No suitable donor found.\n";
    }

    cout << "\n=========================================\n";
    cout << "       TEST COMPLETED SUCCESSFULLY\n";
    cout << "=========================================\n";

    return 0;
}