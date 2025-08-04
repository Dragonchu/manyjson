#ifndef MANYJSON_H
#define MANYJSON_H

#include <string>
#include <vector>

namespace manyjson
{

    /**
     * @brief JSON文件管理器类
     *
     * 用于管理多个JSON文件并显示它们之间的关系
     */
    class JsonManager
    {
    public:
        JsonManager();
        ~JsonManager();

        /**
         * @brief 添加JSON文件到管理器
         * @param filepath JSON文件路径
         * @return 是否成功添加
         */
        bool addJsonFile(const std::string &filepath);

        /**
         * @brief 获取所有JSON文件路径
         * @return JSON文件路径列表
         */
        std::vector<std::string> getJsonFiles() const;

        /**
         * @brief 分析JSON文件之间的关系
         */
        void analyzeRelationships();

    private:
        std::vector<std::string> json_files_;
    };

} // namespace manyjson

#endif // MANYJSON_H