#include "manyjson.h"
#include <iostream>

namespace manyjson {

JsonManager::JsonManager() {
    std::cout << "JsonManager constructor called" << std::endl;
}

JsonManager::~JsonManager() {
    std::cout << "JsonManager destructor called" << std::endl;
}

bool JsonManager::addJsonFile(const std::string& filepath) {
    json_files_.push_back(filepath);
    std::cout << "Added JSON file: " << filepath << std::endl;
    return true;
}

std::vector<std::string> JsonManager::getJsonFiles() const {
    return json_files_;
}

void JsonManager::analyzeRelationships() {
    std::cout << "Analyzing relationships between " << json_files_.size() << " JSON files..." << std::endl;
    // TODO: 实现JSON文件关系分析逻辑
}

} // namespace manyjson 