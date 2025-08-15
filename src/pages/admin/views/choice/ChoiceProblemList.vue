<template>
  <div class="view">
    <Panel title="选择题管理">
      <div slot="header">
        <el-button
          type="primary"
          size="small"
          @click="goCreateChoiceProblem"
          icon="el-icon-plus">创建选择题</el-button>
        <el-button
          type="success"
          size="small"
          @click="goImportExport"
          icon="el-icon-upload2">导入导出</el-button>
        <el-button
          type="info"
          size="small"
          @click="goStatistics"
          icon="el-icon-data-analysis">统计分析</el-button>
        <el-select v-model="keyword" size="small" clearable placeholder="筛选条件" style="width: 120px; margin-left: 10px;">
          <el-option label="题目" value="title"></el-option>
          <el-option label="作者" value="created_by__username"></el-option>
          <el-option label="难度" value="difficulty"></el-option>
        </el-select>
        <el-select v-model="selectedCategory" size="small" clearable placeholder="选择分类" @change="filterByCategory" style="width: 120px; margin-left: 10px;">
          <el-option label="全部分类" value=""></el-option>
          <el-option
            v-for="category in categoryList"
            :key="category.id"
            :label="category.full_path || category.name"
            :value="category.id">
          </el-option>
        </el-select>
        <el-input
          v-model="query"
          prefix-icon="el-icon-search"
          placeholder="输入关键词搜索"
          @keyup.enter.native="filterByKeyword"
          size="small"
          clearable
          style="width: 200px; margin-left: 10px;">
        </el-input>
      </div>
      
      <el-table
        v-loading="loadingTable"
        element-loading-text="loading"
        ref="table"
        :data="choiceProblems"
        style="width: 100%">
        
        <el-table-column width="80" prop="id" label="ID">
        </el-table-column>
        
        <el-table-column prop="title" label="题目" show-overflow-tooltip min-width="200">
        </el-table-column>
        
        <el-table-column prop="created_by.username" label="作者" width="120">
         </el-table-column>
         
         <el-table-column prop="difficulty" label="难度" width="100">
           <template slot-scope="scope">
             <el-tag :type="getDifficultyTagType(scope.row.difficulty)" size="small">
               {{ scope.row.difficulty }}
             </el-tag>
           </template>
         </el-table-column>
         
         <el-table-column prop="create_time" label="创建时间" width="160">
           <template slot-scope="scope">
             {{ scope.row.create_time | localtime }}
           </template>
         </el-table-column>
         
         <el-table-column prop="visible" label="状态" width="100" align="center">
           <template slot-scope="scope">
             <el-switch
               v-model="scope.row.visible"
               @change="handleVisibleSwitch(scope.row)">
             </el-switch>
           </template>
         </el-table-column>
         
         <el-table-column width="180" label="操作" align="center">
           <template slot-scope="scope">
             <el-button
               type="primary"
               size="mini"
               icon="el-icon-edit"
               @click="goEdit(scope.row.id)">编辑</el-button>
             <el-button
               type="danger"
               size="mini"
               icon="el-icon-delete"
               @click="deleteChoiceProblem(scope.row.id)">删除</el-button>
           </template>
         </el-table-column>
       </el-table>
      
      <div class="panel-options">
        <el-pagination
          class="page"
          @current-change="currentChange"
          @size-change="handleSizeChange"
          :page-sizes="[10, 20, 50, 100]"
          :page-size="pageSize"
          :current-page="currentPage"
          :total="total"
          layout="sizes, prev, pager, next">
        </el-pagination>
      </div>
    </Panel>
  </div>
</template>

<script>
import api from '../../api.js'

export default {
  name: 'ChoiceProblemList',
  data () {
    return {
      pageSize: 10,
      total: 0,
      choiceProblems: [],
      keyword: '',
      query: '',
      loadingTable: false,
      currentPage: 1,
      visibleCount: 0,
      difficultyStats: {
        Low: 0,
        Mid: 0,
        High: 0
      },
      categoryList: [],
      selectedCategory: ''
    }
  },
  mounted () {
    this.getChoiceProblemList(1)
    this.getCategoryList()
  },
  methods: {
    currentChange (page) {
      this.currentPage = page
      this.getChoiceProblemList(page)
    },
    handleSizeChange (size) {
      this.pageSize = size
      this.currentPage = 1
      this.getChoiceProblemList(1)
    },
    tableRowClassName ({row, rowIndex}) {
      if (rowIndex % 2 === 1) {
        return 'warning-row'
      }
      return ''
    },
    getChoiceProblemList (page) {
      this.loadingTable = true
      let params = {
        limit: this.pageSize,
        offset: (page - 1) * this.pageSize
      }
      if (this.keyword && this.query.trim()) {
        params[this.keyword] = this.query
      }
      if (this.selectedCategory) {
        params.category = this.selectedCategory
      }
      api.getChoiceProblemList(params).then(res => {
        this.loadingTable = false
        this.total = res.data.data.total
        this.choiceProblems = res.data.data.results
        this.updateStatistics()
      }, res => {
        this.loadingTable = false
      })
    },
    goCreateChoiceProblem () {
      this.$router.push({name: 'create-choice-problem'})
    },
    goEdit (choiceProblemId) {
      this.$router.push({name: 'edit-choice-problem', params: {problemId: choiceProblemId}})
    },
    deleteChoiceProblem (id) {
      this.$confirm('确定删除此选择题吗?', '删除选择题', {
        type: 'warning'
      }).then(() => {
        api.deleteChoiceProblem(id).then(() => {
          this.getChoiceProblemList(this.currentPage)
          this.$success('删除成功')
        })
      }, () => {
      })
    },
    filterByKeyword () {
      this.currentChange(1)
    },
    handleVisibleSwitch (row) {
      api.editChoiceProblem({
        id: row.id,
        visible: row.visible
      })
    },
    getDifficultyTagType (difficulty) {
      const typeMap = {
        'Low': 'success',
        'Mid': 'warning',
        'High': 'danger'
      }
      return typeMap[difficulty] || 'info'
    },
    updateStatistics () {
      // 更新可见题目数量
      this.visibleCount = this.choiceProblems.filter(p => p.visible).length
      
      // 更新难度统计
      this.difficultyStats = {
        Low: this.choiceProblems.filter(p => p.difficulty === 'Low').length,
        Mid: this.choiceProblems.filter(p => p.difficulty === 'Mid').length,
        High: this.choiceProblems.filter(p => p.difficulty === 'High').length
      }
    },
    goImportExport () {
      this.$router.push({name: 'choice-import-export'})
    },
    goStatistics () {
      this.$router.push({name: 'choice-statistics'})
    },
    getCategoryList () {
      api.getCategoryList().then(res => {
        this.categoryList = res.data.data
      })
    },
    filterByCategory () {
      this.currentPage = 1
      this.getChoiceProblemList(1)
    },
    filterByKeyword () {
      this.currentPage = 1
      this.getChoiceProblemList(1)
    }
  }
}
</script>

<style scoped>
.view {
  padding: 20px;
}

.panel-options {
  text-align: center;
  margin-top: 20px;
}

.page {
  display: inline-block;
}
</style>