#ifndef DONOR_H
#define DONOR_H

#include <string>
using namespace std;

class Donor
{
private:
    string donorId;
    string name;
    string bloodGroup;
    bool available;
    int distance;
    string lastDonationDate;

public:
    Donor();

    Donor(string id, string donorName, string group,
          bool isAvailable, int donorDistance,
          string lastDate);

    string getDonorId() const;
    string getName() const;
    string getBloodGroup() const;
    bool isAvailable() const;
    int getDistance() const;
    string getLastDonationDate() const;

    void setAvailability(bool status);

    int daysSinceLastDonation() const;
    bool isEligible(int minimumGapDays = 90) const;

    void display() const;
};

#endif