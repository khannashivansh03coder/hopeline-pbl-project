#include "../include/Donor.h"

#include <iostream>
#include <sstream>
#include <ctime>
#include <iomanip>

using namespace std;

Donor::Donor()
{
    donorId = "";
    name = "";
    bloodGroup = "";
    available = false;
    distance = 0;
    lastDonationDate = "";
}

Donor::Donor(string id, string donorName, string group,
             bool isAvailable, int donorDistance,
             string lastDate)
{
    donorId = id;
    name = donorName;
    bloodGroup = group;
    available = isAvailable;
    distance = donorDistance;
    lastDonationDate = lastDate;
}

string Donor::getDonorId() const
{
    return donorId;
}

string Donor::getName() const
{
    return name;
}

string Donor::getBloodGroup() const
{
    return bloodGroup;
}

bool Donor::isAvailable() const
{
    return available;
}

int Donor::getDistance() const
{
    return distance;
}

string Donor::getLastDonationDate() const
{
    return lastDonationDate;
}

void Donor::setAvailability(bool status)
{
    available = status;
}

int Donor::daysSinceLastDonation() const
{
    if (lastDonationDate.empty())
    {
        return -1;
    }

    int year, month, day;
    char c1, c2;

    stringstream ss(lastDonationDate);

    ss >> year >> c1 >> month >> c2 >> day;

    if (ss.fail() || c1 != '-' || c2 != '-')
    {
        return -1;
    }

    tm lastDate = {};
    lastDate.tm_year = year - 1900;
    lastDate.tm_mon = month - 1;
    lastDate.tm_mday = day;
    lastDate.tm_hour = 0;
    lastDate.tm_min = 0;
    lastDate.tm_sec = 0;

    time_t lastTime = mktime(&lastDate);

    if (lastTime == -1)
    {
        return -1;
    }

    time_t currentTime = time(nullptr);
    tm currentDate = *localtime(&currentTime);

    currentDate.tm_hour = 0;
    currentDate.tm_min = 0;
    currentDate.tm_sec = 0;

    currentTime = mktime(&currentDate);

    double difference = difftime(currentTime, lastTime);

    int days = static_cast<int>(difference / (60 * 60 * 24));

    return days;
}

bool Donor::isEligible(int minimumGapDays) const
{
    int days = daysSinceLastDonation();

    if (days < 0)
    {
        return false;
    }

    return days >= minimumGapDays;
}

void Donor::display() const
{
    cout << "Donor ID        : " << donorId << endl;
    cout << "Name            : " << name << endl;
    cout << "Blood Group     : " << bloodGroup << endl;
    cout << "Available       : "
         << (available ? "Yes" : "No") << endl;
    cout << "Distance        : " << distance << " km" << endl;
    cout << "Last Donation   : " << lastDonationDate << endl;
    cout << "Eligible        : "
         << (isEligible() ? "Yes" : "No") << endl;
}