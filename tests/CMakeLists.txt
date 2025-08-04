# 自动扫描tests目录中的所有测试文件
file(GLOB_RECURSE TEST_SOURCES "*.cpp")

if(TEST_SOURCES)
    # 创建测试可执行文件
    add_executable(run_tests ${TEST_SOURCES})
    
    # 链接主项目库
    target_link_libraries(run_tests PRIVATE manyjson_lib)
    
    # 链接Google Test
    if(TARGET gtest)
        # 使用下载的Google Test
        target_link_libraries(run_tests PRIVATE gtest gtest_main)
    elseif(GTest_FOUND)
        # 使用系统安装的Google Test
        target_link_libraries(run_tests PRIVATE GTest::gtest GTest::gtest_main)
    else()
        message(FATAL_ERROR "Google Test not found")
    endif()
    
    # 添加测试
    add_test(NAME UnitTests COMMAND run_tests)
    
    # 设置测试输出目录
    set_target_properties(run_tests PROPERTIES
        RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/bin
    )
endif() 