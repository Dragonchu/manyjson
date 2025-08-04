cmake_minimum_required(VERSION 3.16)
project(ManyJson VERSION 1.0.0 LANGUAGES CXX)

# 配置选项
option(ENABLE_TESTS "Enable tests" ON)
option(DOWNLOAD_GTEST "Download Google Test if not found" ON)

# 设置C++标准
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# 设置编译选项
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -Wall -Wextra -Wpedantic")
set(CMAKE_CXX_FLAGS_DEBUG "${CMAKE_CXX_FLAGS_DEBUG} -g -O0")
set(CMAKE_CXX_FLAGS_RELEASE "${CMAKE_CXX_FLAGS_RELEASE} -O3")

# 设置输出目录
set(CMAKE_RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/bin)
set(CMAKE_LIBRARY_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/lib)
set(CMAKE_ARCHIVE_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/lib)

# 包含目录
include_directories(${CMAKE_SOURCE_DIR}/include)

# 自动扫描src目录中的所有.cpp文件
file(GLOB_RECURSE SOURCES "src/*.cpp")
file(GLOB_RECURSE HEADERS "include/*.h" "include/*.hpp")

# 打印找到的源文件（调试用）
message(STATUS "Found source files: ${SOURCES}")
message(STATUS "Found header files: ${HEADERS}")

# 创建库文件（供测试使用）
add_library(manyjson_lib STATIC ${SOURCES} ${HEADERS})

# 创建可执行文件
add_executable(manyjson src/main.cpp)
target_link_libraries(manyjson PRIVATE manyjson_lib)

# 设置可执行文件的属性
set_target_properties(manyjson PROPERTIES
    OUTPUT_NAME "manyjson"
    RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/bin
)

# Google Test支持
if(ENABLE_TESTS)
    # 首先尝试查找系统安装的Google Test
    find_package(GTest QUIET)
    
    if(NOT GTest_FOUND AND DOWNLOAD_GTEST)
        # 如果系统没有安装，则下载Google Test
        if(EXISTS "${CMAKE_SOURCE_DIR}/third_party/googletest")
            message(STATUS "Using downloaded Google Test")
            add_subdirectory(third_party/googletest)
        else()
            message(STATUS "Downloading Google Test...")
            include(FetchContent)
            FetchContent_Declare(
                googletest
                GIT_REPOSITORY https://github.com/google/googletest.git
                GIT_TAG release-1.12.1
            )
            FetchContent_MakeAvailable(googletest)
        endif()
    elseif(GTest_FOUND)
        message(STATUS "Using system Google Test")
    endif()
    
    # 启用测试
    enable_testing()
    
    # 测试支持（如果tests目录存在）
    if(EXISTS "${CMAKE_SOURCE_DIR}/tests")
        add_subdirectory(tests)
    endif()
else()
    message(STATUS "Tests disabled")
endif()

# 如果需要链接其他库，可以在这里添加
# find_package(SomeLibrary REQUIRED)
# target_link_libraries(manyjson PRIVATE SomeLibrary::SomeLibrary)

# 安装规则
install(TARGETS manyjson manyjson_lib
    RUNTIME DESTINATION bin
    LIBRARY DESTINATION lib
    ARCHIVE DESTINATION lib
)

# 安装头文件
if(HEADERS)
    install(FILES ${HEADERS}
        DESTINATION include/manyjson
    )
endif()

# 安装README文件
install(FILES README.md
    DESTINATION share/doc/manyjson
) 