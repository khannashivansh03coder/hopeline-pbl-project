#ifndef BLOODUNIT_H
#define BLOODUNIT_H

#include <string>
using namespace std;

class BloodUnit
{
private:
    string unitId;
    string bloodGroup;
    string expiryDate;
    string status;

public:
    BloodUnit();

    BloodUnit(string id, string group,
              string expiry, string unitStatus);

    string getUnitId() const;
    string getBloodGroup() const;
    string getExpiryDate() const;
    string getStatus() const;

    void setStatus(string newStatus);

    bool isAvailable() const;

    void display() const;
};

#endif