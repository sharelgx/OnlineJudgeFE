<template>
  <div class="view">
    <Panel title="分类管理">
      <div slot="header">
        <el-input v-model="keyword" prefix-icon="el-icon-search" placeholder="搜索分类名称"></el-input>
      </div>
      <el-table v-loading="loading" :data="list" style="width: 100%" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55"></el-table-column>
        <el-table-column width="100" prop="id" label="ID"></el-table-column>
        <el-table-column prop="name" label="分类名称">
          <template slot-scope="{row}">
            <div v-show="!row.isEditing" class="title-cell clickable" @click="handleEdit(row)">{{ row.name }}</div>
            <el-input v-show="row.isEditing" v-model="row.name" placeholder="分类名称" @keyup.enter.native="handleInlineEdit(row)"></el-input>
          </template>
        </el-table-column>
        <el-table-column prop="parent_name" label="父分类" width="150">
          <template slot-scope="scope">
            <span>{{ scope.row.parent_name || '根分类' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" show-overflow-tooltip></el-table-column>
        <el-table-column prop="choice_count" label="题目数量" width="100">
          <template slot-scope="scope">
            <el-tag size="small">{{ scope.row.choice_count || 0 }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column width="200" prop="created_at" label="创建时间">
          <template slot-scope="scope">{{ scope.row.created_at | localtime }}</template>
        </el-table-column>
        <el-table-column fixed="right" label="操作" width="260">
          <div slot-scope="scope">
            <icon-btn name="编辑" icon="edit" @click.native="handleEdit(scope.row)"></icon-btn>
            <icon-btn name="添加子分类" icon="plus" @click.native="handleAddChild(scope.row)"></icon-btn>
            <icon-btn icon="trash" name="删除" @click.native="deleteItem(scope.row.id)"></icon-btn>
          </div>
        </el-table-column>
      </el-table>
      <div class="panel-options">
        <div class="left-buttons">
          <el-button type="primary" size="small" @click="handleCreate" icon="el-icon-plus">新建分类</el-button>
          <el-button type="danger" size="small" @click="batchDelete" :disabled="selectedItems.length === 0" icon="el-icon-delete">批量删除</el-button>
        </div>
        <el-pagination class="page" layout="prev, pager, next" @current-change="currentChange" :page-size="pageSize" :total="total"></el-pagination>
      </div>
    </Panel>

    <!-- 新建/编辑分类对话框 -->
    <el-dialog :title="dialogTitle" width="40%" :visible.sync="dialogVisible" @close="resetForm">
      <el-form :model="form" :rules="rules" ref="form" label-width="100px">
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入分类名称"></el-input>
        </el-form-item>
        <el-form-item label="父分类" prop="parent_id">
          <el-select v-model="form.parent_id" placeholder="请选择父分类（可选）" clearable style="width: 100%">
            <el-option label="根分类" :value="null"></el-option>
            <el-option v-for="category in categoryOptions" :key="category.id" :label="category.name" :value="category.id"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input type="textarea" v-model="form.description" placeholder="请输入分类描述（可选）" :rows="3"></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <cancel @click.native="dialogVisible = false"></cancel>
        <save @click.native="submitForm"></save>
      </span>
    </el-dialog>

    <!-- 行内编辑确认对话框 -->
    <el-dialog title="确认更新" width="20%" :visible.sync="inlineEditDialogVisible" @close-on-click-modal="false">
      <div>
        <p>分类名称：{{ currentRow.name }}</p>
      </div>
      <span slot="footer">
        <cancel @click.native="inlineEditDialogVisible = false; getList(currentPage)"></cancel>
        <save @click.native="updateItem(currentRow)"></save>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import api from '../../api'
import utils from '@/utils/utils'

export default {
  name: 'CategoryList',
  data () {
    return {
      pageSize: 10,
      total: 0,
      list: [],
      keyword: '',
      loading: false,
      currentPage: 1,
      selectedItems: [],
      dialogVisible: false,
      inlineEditDialogVisible: false,
      currentRow: {},
      isEdit: false,
      categoryOptions: [],
      form: {
        name: '',
        parent_id: null,
        description: ''
      },
      rules: {
        name: [
          { required: true, message: '请输入分类名称', trigger: 'blur' },
          { min: 1, max: 50, message: '长度在 1 到 50 个字符', trigger: 'blur' }
        ]
      }
    }
  },
  computed: {
    dialogTitle () {
      return this.isEdit ? '编辑分类' : '新建分类'
    }
  },
  mounted () {
    this.getList(1)
    this.getCategoryOptions()
  },
  methods: {
    // 获取分类列表
    getList (page) {
      this.loading = true
      this.currentPage = page
      let params = {
        limit: this.pageSize,
        offset: (page - 1) * this.pageSize
      }
      if (this.keyword) {
        params.keyword = this.keyword
      }
      api.getCategoryList(params).then(res => {
        this.loading = false
        this.total = res.data.data.total
        this.list = res.data.data.results
      }, res => {
        this.loading = false
      })
    },
    // 获取分类选项（用于父分类选择）
    getCategoryOptions () {
      api.getCategoryList({ limit: 1000 }).then(res => {
        this.categoryOptions = res.data.data.results
      })
    },
    // 处理创建
    handleCreate () {
      this.isEdit = false
      this.form = {
        name: '',
        parent_id: null,
        description: ''
      }
      this.dialogVisible = true
    },
    // 处理编辑
    handleEdit (row) {
      this.isEdit = true
      this.form = {
        id: row.id,
        name: row.name,
        parent_id: row.parent_id,
        description: row.description || ''
      }
      this.dialogVisible = true
    },
    // 处理添加子分类
    handleAddChild (row) {
      this.isEdit = false
      this.form = {
        name: '',
        parent_id: row.id,
        description: ''
      }
      this.dialogVisible = true
    },
    // 提交表单
    submitForm () {
      this.$refs.form.validate((valid) => {
        if (valid) {
          if (this.isEdit) {
            this.updateCategory()
          } else {
            this.createCategory()
          }
        }
      })
    },
    // 创建分类
    createCategory () {
      api.createCategory(this.form).then(res => {
        this.$success('创建成功')
        this.dialogVisible = false
        this.getList(1)
        this.getCategoryOptions()
      }).catch(() => {})
    },
    // 更新分类
    updateCategory () {
      api.updateCategory(this.form.id, this.form).then(res => {
        this.$success('更新成功')
        this.dialogVisible = false
        this.getList(this.currentPage)
        this.getCategoryOptions()
      }).catch(() => {})
    },
    // 删除分类
    deleteItem (id) {
      this.$confirm('确定要删除这个分类吗？删除后该分类下的所有子分类也会被删除。', '确认删除', {
        type: 'warning'
      }).then(() => {
        api.deleteCategory(id).then(res => {
          this.$success('删除成功')
          this.getList(this.currentPage)
          this.getCategoryOptions()
        }).catch(() => {})
      }).catch(() => {})
    },
    // 批量删除
    batchDelete () {
      this.$confirm(`确定要删除选中的 ${this.selectedItems.length} 个分类吗？`, '确认删除', {
        type: 'warning'
      }).then(() => {
        let ids = this.selectedItems.map(item => item.id)
        api.batchDeleteCategory(ids).then(res => {
          this.$success('删除成功')
          this.getList(this.currentPage)
          this.getCategoryOptions()
        }).catch(() => {})
      }).catch(() => {})
    },
    // 行内编辑
    handleInlineEdit (row) {
      this.currentRow = row
      this.inlineEditDialogVisible = true
    },
    // 更新项目
    updateItem (row) {
      api.updateCategory(row.id, { name: row.name }).then(res => {
        this.$success('更新成功')
        this.inlineEditDialogVisible = false
        this.getList(this.currentPage)
        this.getCategoryOptions()
      }).catch(() => {
        this.getList(this.currentPage)
      })
    },
    // 重置表单
    resetForm () {
      if (this.$refs.form) {
        this.$refs.form.resetFields()
      }
    },
    // 处理选择变化
    handleSelectionChange (val) {
      this.selectedItems = val
    },
    // 分页变化
    currentChange (page) {
      this.getList(page)
    }
  },
  watch: {
    keyword () {
      this.getList(1)
    }
  }
}
</script>

<style scoped>
.title-cell {
  cursor: pointer;
}
.title-cell:hover {
  color: #409EFF;
}
</style>