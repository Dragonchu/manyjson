#include <gtest/gtest.h>
#include "manyjson.h"

class JsonManagerTest : public ::testing::Test {
protected:
    void SetUp() override {
        // 每个测试前的设置
    }

    void TearDown() override {
        // 每个测试后的清理
    }
};

TEST_F(JsonManagerTest, ConstructorTest) {
    manyjson::JsonManager manager;
    auto files = manager.getJsonFiles();
    EXPECT_EQ(files.size(), 0);
}

TEST_F(JsonManagerTest, AddJsonFileTest) {
    manyjson::JsonManager manager;
    
    // 测试添加文件
    bool result = manager.addJsonFile("test1.json");
    EXPECT_TRUE(result);
    
    auto files = manager.getJsonFiles();
    EXPECT_EQ(files.size(), 1);
    EXPECT_EQ(files[0], "test1.json");
    
    // 测试添加多个文件
    manager.addJsonFile("test2.json");
    files = manager.getJsonFiles();
    EXPECT_EQ(files.size(), 2);
    EXPECT_EQ(files[1], "test2.json");
}

TEST_F(JsonManagerTest, AnalyzeRelationshipsTest) {
    manyjson::JsonManager manager;
    manager.addJsonFile("test1.json");
    manager.addJsonFile("test2.json");
    
    // 测试关系分析（目前只是打印信息）
    EXPECT_NO_THROW(manager.analyzeRelationships());
}

int main(int argc, char **argv) {
    ::testing::InitGoogleTest(&argc, argv);
    return RUN_ALL_TESTS();
} 