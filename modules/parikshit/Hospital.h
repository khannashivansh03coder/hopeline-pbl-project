#ifndef HOSPITAL_H
#define HOSPITAL_H

#include "Resource.h"
#include <vector>
#include <memory>

class Hospital {
private:
    std::string name;
    std::vector<std::unique_ptr<Resource>> resources;

public:
    Hospital(const std::string& name);

    void addResource(std::unique_ptr<Resource> resource);
    Resource* findResource(int id);

    bool allocateResource(int id);
    bool releaseResource(int id);
    bool reserveResource(int id);

    void displayResources() const;
};

#endif
