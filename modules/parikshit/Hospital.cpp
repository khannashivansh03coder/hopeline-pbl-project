#include "Hospital.h"
#include <iostream>

Hospital::Hospital(const std::string& name)
    : name(name) {}

void Hospital::addResource(std::unique_ptr<Resource> resource) {
    resources.push_back(std::move(resource));
}

Resource* Hospital::findResource(int id) {
    for (const auto& resource : resources) {
        if (resource->getId() == id) {
            return resource.get();
        }
    }
    return nullptr;
}

bool Hospital::allocateResource(int id) {
    Resource* resource = findResource(id);

    if (resource == nullptr ||
        resource->getState() != ResourceState::AVAILABLE) {
        return false;
    }

    resource->occupy();
    return true;
}

bool Hospital::releaseResource(int id) {
    Resource* resource = findResource(id);

    if (resource == nullptr) {
        return false;
    }

    resource->release();
    return true;
}

bool Hospital::reserveResource(int id) {
    Resource* resource = findResource(id);

    if (resource == nullptr ||
        resource->getState() != ResourceState::AVAILABLE) {
        return false;
    }

    resource->reserve();
    return true;
}

void Hospital::displayResources() const {
    std::cout << "\nHospital: " << name << std::endl;
    std::cout << "--------------------------" << std::endl;

    for (const auto& resource : resources) {
        resource->display();

        std::cout << "Status: ";

        switch (resource->getState()) {
            case ResourceState::AVAILABLE:
                std::cout << "Available";
                break;

            case ResourceState::OCCUPIED:
                std::cout << "Occupied";
                break;

            case ResourceState::RESERVED:
                std::cout << "Reserved";
                break;
        }

        std::cout << std::endl;
    }
}
