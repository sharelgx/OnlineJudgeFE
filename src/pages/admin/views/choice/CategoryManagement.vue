<template>
  <div class="view">
    <Panel title="分类管理">
      <div slot="header">
        <el-button
          type="primary"
          size="small"
          @click="showCreateDialog"
          icon="el-icon-plus">创建分类</el-button>
        <el-button
          type="success"
          size="small"
          @click="refreshList"
          icon="el-icon-refresh">刷新</el-button>
        <el-input
          v-model="searchKeyword"
          prefix-icon="el-icon-search"
          placeholder="搜索分类名称或代码"
          @keyup.enter.native="searchCategories"
          size="small"
          clearable
          style="width: 200px; margin-left: 10px;">
        </el-input>
      </div>
      
      <el-table
        :data="categories"
        v-loading="loadingTable"
        element-loading-text="loading"
        ref="table"
        style="width: 100%">
        
        <el-table-column prop="id" label="ID" width="80">
        </el-table-column>
        
        <el-table-column prop="name" label="分类名称" min-width="150">
          <template slot-scope="scope">
            {{ scope.row.full_path || scope.row.name }}
          </template>
        </el-table-column>
        
        <el-table-column prop="parent_name" label="父分类" width="120">
          <template slot-scope="scope">
            {{ scope.row.parent_name || '根分类' }}
          </template>
        </el-table-column>
        
        <el-table-column prop="code" label="分类代码" width="150">
        </el-table-column>
        
        <el-table-column prop="description" label="描述" min-width="200">
          <template slot-scope="scope">
            {{ scope.row.description || '暂无描述' }}
          </template>
        </el-table-column>
        
        <el-table-column prop="is_active" label="状态" width="100" align="center">
          <template slot-scope="scope">
            <el-switch
              v-model="scope.row.is_active"
              @change="toggleCategoryStatus(scope.row)">
            </el-switch>
          </template>
        </el-table-column>
        
        <el-table-column prop="create_time" label="创建时间" width="180">
          <template slot-scope="scope">
            {{ scope.row.create_time | localtime }}
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="200" align="center">
          <template slot-scope="scope">
            <el-button
              type="primary"
              size="mini"
              icon="el-icon-edit"
              @click="showEditDialog(scope.row)">编辑</el-button>
            <el-button
              type="danger"
              size="mini"
              icon="el-icon-delete"
              @click="deleteCategory(scope.row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="panel-options">
        <el-pagination
          class="page"
          @size-change="handleSizeChange"
          @current-change="currentChange"
          :current-page="currentPage"
          :page-sizes="[10, 20, 30, 50]"
          :page-size="pageSize"
          :total="total"
          layout="sizes, prev, pager, next">
        </el-pagination>
      </div>
    </Panel>
    
    <!-- 创建/编辑分类对话框 -->
    <el-dialog
      :title="dialogMode === 'create' ? '创建分类' : '编辑分类'"
      :visible.sync="dialogVisible"
      width="500px"
      @close="resetForm">
      
      <el-form
        :model="categoryForm"
        :rules="formRules"
        ref="categoryForm"
        label-width="80px">
        
        <el-form-item label="分类名称" prop="name">
          <el-input
            v-model="categoryForm.name"
            placeholder="请输入分类名称"
            maxlength="50"
            show-word-limit>
          </el-input>
        </el-form-item>
        
        <el-form-item label="分类代码" prop="code">
          <el-input
            v-model="categoryForm.code"
            placeholder="请输入分类代码（英文字母和下划线）"
            maxlength="30"
            show-word-limit>
          </el-input>
        </el-form-item>
        
        <el-form-item label="父分类" prop="parent">
          <el-select
            v-model="categoryForm.parent"
            placeholder="选择父分类（留空为根分类）"
            clearable
            filterable>
            <el-option
              v-for="category in availableParents"
              :key="category.id"
              :label="category.full_path || category.name"
              :value="category.id">
            </el-option>
          </el-select>
        </el-form-item>
        
        <el-form-item label="描述" prop="description">
          <el-input
            type="textarea"
            v-model="categoryForm.description"
            placeholder="请输入分类描述"
            :rows="3"
            maxlength="200"
            show-word-limit>
          </el-input>
        </el-form-item>
        
        <el-form-item label="状态" prop="is_active">
          <el-switch
            v-model="categoryForm.is_active"
            active-text="启用"
            inactive-text="禁用">
          </el-switch>
        </el-form-item>
      </el-form>
      
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitting">
          {{ dialogMode === 'create' ? '创建' : '更新' }}
        </el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import api from '../../api.js'

export default {
  name: 'CategoryManagement',
  data () {
    return {
      pageSize: 10,
      total: 0,
      categories: [],
      availableParents: [],
      searchKeyword: '',
      loadingTable: false,
      currentPage: 1,
      activeCount: 0,
      dialogVisible: false,
      dialogMode: 'create', // 'create' or 'edit'
      submitting: false,
      categoryForm: {
        id: null,
        name: '',
        code: '',
        description: '',
        parent: null,
        is_active: true
      },
      formRules: {
        name: [
          { required: true, message: '请输入分类名称', trigger: 'blur' },
          { min: 1, max: 50, message: '长度在 1 到 50 个字符', trigger: 'blur' }
        ],
        code: [
          { required: true, message: '请输入分类代码', trigger: 'blur' },
          { pattern: /^[a-zA-Z_][a-zA-Z0-9_]*$/, message: '只能包含字母、数字和下划线，且以字母或下划线开头', trigger: 'blur' },
          { min: 1, max: 30, message: '长度在 1 到 30 个字符', trigger: 'blur' }
        ]
      }
    }
  },
  mounted () {
    this.getCategoryList(1)
  },
  methods: {
    currentChange (page) {
      this.currentPage = page
      this.getCategoryList(page)
    },
    handleSizeChange (size) {
      this.pageSize = size
      this.currentPage = 1
      this.getCategoryList(1)
    },
    tableRowClassName ({row, rowIndex}) {
      if (rowIndex % 2 === 1) {
        return 'warning-row'
      }
      return ''
    },
    getCategoryList (page) {
      this.loadingTable = true
      let params = {
        limit: this.pageSize,
        offset: (page - 1) * this.pageSize
      }
      if (this.searchKeyword.trim()) {
        params.search = this.searchKeyword
      }
      api.getCategoryList(params).then(res => {
        this.loadingTable = false
        this.total = res.data.data.total || res.data.data.length
        this.categories = res.data.data.results || res.data.data
        this.updateStatistics()
      }, res => {
        this.loadingTable = false
      })
    },
    updateStatistics () {
      this.activeCount = this.categories.filter(cat => cat.is_active).length
    },
    searchCategories () {
      this.currentPage = 1
      this.getCategoryList(1)
    },
    refreshList () {
      this.searchKeyword = ''
      this.currentPage = 1
      this.getCategoryList(1)
    },
    showCreateDialog () {
      this.dialogMode = 'create'
      this.resetForm()
      this.getAvailableParents()
      this.dialogVisible = true
    },
    showEditDialog (category) {
      this.dialogMode = 'edit'
      this.categoryForm = {
        id: category.id,
        name: category.name,
        code: category.code,
        description: category.description || '',
        parent: category.parent,
        is_active: category.is_active
      }
      this.getAvailableParents(category.id)
      this.dialogVisible = true
    },
    resetForm () {
      this.categoryForm = {
        id: null,
        name: '',
        code: '',
        description: '',
        parent: null,
        is_active: true
      }
      if (this.$refs.categoryForm) {
        this.$refs.categoryForm.resetFields()
      }
    },
    getAvailableParents (excludeId = null) {
      // 获取所有分类作为可选父分类，排除当前编辑的分类及其子分类
      api.getCategoryList().then(res => {
        let allCategories = res.data.data.results || res.data.data
        if (excludeId) {
          // 编辑模式：排除自己和自己的子分类
          this.availableParents = allCategories.filter(cat => {
            return cat.id !== excludeId && !this.isDescendant(cat, excludeId, allCategories)
          })
        } else {
          // 创建模式：所有分类都可作为父分类
          this.availableParents = allCategories
        }
      })
    },
    isDescendant (category, ancestorId, allCategories) {
      // 检查category是否是ancestorId的后代
      let parent = category.parent
      while (parent) {
        if (parent === ancestorId) {
          return true
        }
        let parentCategory = allCategories.find(cat => cat.id === parent)
        parent = parentCategory ? parentCategory.parent : null
      }
      return false
    },
    submitForm () {
      this.$refs.categoryForm.validate((valid) => {
        if (!valid) {
          this.$error('请检查表单')
          return
        }
        
        this.submitting = true
        const apiMethod = this.dialogMode === 'create' ? 'createCategory' : 'editCategory'
        
        api[apiMethod](this.categoryForm).then(res => {
          this.submitting = false
          this.dialogVisible = false
          this.$success(this.dialogMode === 'create' ? '创建成功' : '更新成功')
          this.getCategoryList(this.currentPage)
        }, res => {
          this.submitting = false
        })
      })
    },
    toggleCategoryStatus (category) {
      const data = {
        id: category.id,
        name: category.name,
        code: category.code,
        description: category.description,
        parent: category.parent,
        is_active: category.is_active
      }
      api.editCategory(data).then(res => {
        this.$success('状态更新成功')
        this.updateStatistics()
      }, res => {
        // 恢复原状态
        category.is_active = !category.is_active
      })
    },
    deleteCategory (id) {
      this.$confirm('确定要删除这个分类吗？删除后不可恢复。', '确认删除', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        api.deleteCategory(id).then(res => {
          this.$success('删除成功')
          this.getCategoryList(this.currentPage)
        })
      })
    }
  }
}
</script>

<style scoped>
.dialog-footer {
  text-align: right;
}

.warning-row {
  background: #fdf6ec;
}
</style>