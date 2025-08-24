<template>
  <div class="choice-list">
    <Panel>
      <div slot="title">{{$t('m.NavChoice')}}</div>
      <div class="choice-content">
        <div class="filter-section">
          <Row :gutter="20">
            <Col :span="6">
              <Input v-model="keyword" placeholder="搜索题目" @on-enter="getChoiceList" clearable>
                <Icon type="ios-search" slot="suffix" @click="getChoiceList"></Icon>
              </Input>
            </Col>
            <Col :span="4">
              <Select v-model="difficulty" placeholder="难度" clearable @on-change="getChoiceList">
                <Option value="Low">简单</Option>
                <Option value="Mid">中等</Option>
                <Option value="High">困难</Option>
              </Select>
            </Col>
            <Col :span="6">
              <Select v-model="selectedTags" placeholder="选择标签" multiple clearable @on-change="getChoiceList">
                <Option v-for="tag in tagList" :key="tag.id" :value="tag.id">{{ tag.name }}</Option>
              </Select>
            </Col>
            <Col :span="4">
              <Button type="primary" @click="getChoiceList">搜索</Button>
            </Col>
            <Col :span="4">
              <Button type="success" @click="startBatchPractice" :disabled="selectedChoices.length === 0">
                批量练习 ({{ selectedChoices.length }})
              </Button>
            </Col>
          </Row>
          
          <!-- 分类筛选（仿淘宝分类导航） -->
          <Row style="margin-top: 15px;">
            <Col :span="24">
              <div class="category-mega">
                <div class="left-menu">
                  <div class="menu-item" :class="{active: activeCategoryId === 0}" @click="clearCategory">
                    全部分类
                  </div>
                  <div 
                    v-for="cat in topCategories" 
                    :key="cat.id" 
                    class="menu-item" 
                    :class="{active: (hoverCategoryId || activeCategoryId) === cat.id}"
                    @mouseenter="hoverCategory(cat.id)"
                    @mouseleave="hoverCategory(0)"
                    @click="selectCategory(cat.id)"
                  >
                    {{ cat.name || cat.title }}
                    <Icon type="ios-arrow-forward" class="arrow" />
                  </div>
                </div>
                <div class="right-panel" v-if="activePanel">
                  <div class="panel-section" v-for="sub in activePanel.children" :key="sub.id">
                    <div class="section-title">{{ sub.name || sub.title }}</div>
                    <div class="section-links">
                      <a 
                        v-if="!(sub.children && sub.children.length)" 
                        href="javascript:void(0)" 
                        @click.prevent="selectCategory(sub.id)">
                        全部
                      </a>
                      <a 
                        v-for="leaf in (sub.children && sub.children.length ? sub.children : [])" 
                        :key="leaf.id" 
                        href="javascript:void(0)" 
                        @click.prevent="selectCategory(leaf.id)">
                        {{ leaf.name || leaf.title }}
                      </a>
                    </div>
                  </div>
                  <div class="panel-section tags" v-if="tagList.length">
                    <div class="section-title">热门标签</div>
                    <div class="section-links">
                      <a 
                        v-for="tag in tagList.slice(0, 20)" 
                        :key="tag.id" 
                        href="javascript:void(0)" 
                        :class="{active: selectedTags.includes(tag.id)}"
                        @click.prevent="toggleTag(tag.id)">
                        {{ tag.name }}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </div>
        
        <div class="choice-table" v-if="!loading">
          <Table 
            :columns="columns" 
            :data="choiceList" 
            :loading="loading"
            @on-row-click="goToChoice"
            @on-selection-change="onSelectionChange"
          ></Table>
          
          <div class="pagination">
            <Page 
              :total="total" 
              :page-size="limit"
              :current="page"
              @on-change="onPageChange"
              show-total
            ></Page>
          </div>
        </div>
        
        <div v-else class="loading">
          <Spin size="large">加载中...</Spin>
        </div>
      </div>
    </Panel>
  </div>
</template>

<script>
import api from '@oj/api'

export default {
  name: 'ChoiceList',
  data() {
    return {
      loading: true,
      choiceList: [],
      total: 0,
      page: 1,
      limit: 20,
      keyword: '',
      difficulty: '',
      selectedTags: [],
      selectedCategories: [],
      selectedChoices: [],
      tagList: [],
      categoryTree: [],
      // 新增：分类导航的激活与悬停ID
      activeCategoryId: 0,
      hoverCategoryId: 0,
      columns: [
        {
          type: 'selection',
          width: 60,
          align: 'center'
        },
        {
          title: 'ID',
          key: 'id',
          width: 80,
          sortable: true
        },
        {
          title: '题目',
          key: 'title',
          ellipsis: true,
          render: (h, params) => {
            return h('div', {
              style: {
                cursor: 'pointer',
                color: '#2d8cf0'
              }
            }, params.row.title)
          }
        },
        {
          title: '难度',
          key: 'difficulty',
          width: 100,
          render: (h, params) => {
            const raw = params.row.difficulty
            const str = (raw == null ? '' : String(raw)).toLowerCase()
            let norm = 'medium'
            if (str.includes('low') || str.includes('easy') || str.includes('简')) {
              norm = 'easy'
            } else if (str.includes('high') || str.includes('hard') || str.includes('难')) {
              norm = 'hard'
            } else if (str.includes('mid') || str.includes('medi') || str.includes('中')) {
              norm = 'medium'
            }
            const textMap = { easy: '简单', medium: '中等', hard: '困难' }
            const text = textMap[norm] || (raw == null ? '' : String(raw))
            const styleBase = {
              display: 'inline-block',
              padding: '2px 10px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: 600,
              border: '1px solid transparent'
            }
            const styleByCls = {
              easy: { background: '#f6ffed', color: '#52c41a', borderColor: '#b7eb8f' },
              medium: { background: '#fff7e6', color: '#fa8c16', borderColor: '#ffd591' },
              hard: { background: '#fff2f0', color: '#f5222d', borderColor: '#ffb3b3' }
            }
            return h('span', {
              class: ['difficulty-tag', norm],
              style: { ...styleBase, ...(styleByCls[norm] || styleByCls.medium) }
            }, text)
          }
        },
        {
          title: '分数',
          key: 'total_score',
          width: 80
        },
        {
          title: '标签',
          key: 'tags',
          width: 200,
          render: (h, params) => {
            if (!params.row.tags || params.row.tags.length === 0) {
              return h('span', '-')
            }
            return h('div', params.row.tags.map(tag => {
              return h('Tag', {
                props: {
                  color: 'blue'
                },
                style: {
                  marginRight: '5px'
                }
              }, tag)
            }))
          }
        },
        {
          title: '创建时间',
          key: 'created_time',
          width: 150,
          render: (h, params) => {
            return h('span', new Date(params.row.created_time).toLocaleDateString())
          }
        }
      ]
    }
  },
  mounted() {
    this.getChoiceList()
    this.getTagList()
    this.getCategoryList()
  },
  computed: {
    // 顶级分类列表
    topCategories() {
      return this.categoryTree
    },
    // 当前右侧展示面板：优先使用悬停分类，其次使用已选择分类
    activePanel() {
      const id = this.hoverCategoryId || this.activeCategoryId
      if (!id) return this.topCategories.length ? { children: this.topCategories[0].children || [] } : null
      const find = (list) => {
        for (const item of list) {
          if (item.id === id) return item
          if (item.children && item.children.length) {
            const r = find(item.children)
            if (r) return r
          }
        }
        return null
      }
      return find(this.topCategories)
    }
  },
  methods: {
    async getChoiceList() {
      try {
        this.loading = true
        const offset = (this.page - 1) * this.limit
        const params = {
          keyword: this.keyword,
          difficulty: this.difficulty
        }
        
        // 添加分类筛选
        if (this.selectedCategories.length > 0) {
          params.category_id = this.selectedCategories.join(',')
          params.with_children = true
        }
        
        // 添加标签筛选
        if (this.selectedTags.length > 0) {
          params.tag_ids = this.selectedTags.join(',')
        }
        
        const res = await api.getChoiceList(offset, this.limit, params)
        this.choiceList = res.data.data.results
        this.total = res.data.data.total
        this.loading = false
      } catch (error) {
        console.error('获取选择题列表失败:', error)
        this.loading = false
        this.$error('获取选择题列表失败')
      }
    },
    async getCategoryList() {
      try {
        const res = await api.getCategoryList()
        this.categoryTree = this.buildCategoryTree(res.data.data.results)
      } catch (error) {
        console.error('获取分类列表失败:', error)
      }
    },
    async getTagList() {
      try {
        const res = await api.getTagList()
        this.tagList = res.data.data.results
      } catch (error) {
        console.error('获取标签列表失败:', error)
      }
    },
    buildCategoryTree(categories) {
      const tree = []
      const map = {}
      
      // 创建映射
      categories.forEach(cat => {
        map[cat.id] = { ...cat, children: [] }
      })
      
      // 构建树结构
      categories.forEach(cat => {
        if (cat.parent_id) {
          if (map[cat.parent_id]) {
            map[cat.parent_id].children.push(map[cat.id])
          }
        } else {
          tree.push(map[cat.id])
        }
      })
      
      return tree
    },
    // 新增：分类交互
    hoverCategory(id) {
      this.hoverCategoryId = id
    },
    selectCategory(id) {
      this.activeCategoryId = id
      this.selectedCategories = id ? [id] : []
      this.page = 1
      this.getChoiceList()
    },
    clearCategory() {
      this.selectCategory(0)
    },
    toggleTag(tagId) {
      const idx = this.selectedTags.indexOf(tagId)
      if (idx === -1) this.selectedTags.push(tagId)
      else this.selectedTags.splice(idx, 1)
      this.page = 1
      this.getChoiceList()
    },
    // 旧的 Tree 事件替换为上面的选择函数
    onSelectionChange(selection) {
      this.selectedChoices = selection
    },
    startBatchPractice() {
      if (this.selectedChoices.length === 0) {
        this.$error('请先选择要练习的题目')
        return
      }
      const choiceIds = this.selectedChoices.map(choice => choice.id)
      this.$router.push({
        name: 'choice-practice',
        query: { ids: choiceIds.join(',') }
      })
    },
    onPageChange(page) {
      this.page = page
      this.getChoiceList()
    },
    goToChoice(row) {
      this.$router.push(`/choice/${row.id}`)
    }
  }
}
</script>

<style lang="less" scoped>
.choice-list {
  padding: 20px;

  .choice-content {
    .filter-section {
      margin-bottom: 20px;
      padding: 20px;
      background: #f8f8f9;
      border-radius: 4px;
    }

    /* 新增：淘宝风格的分类导航 */
    .category-mega {
      display: flex;
      border: 1px solid #e8e8e8;
      background: #fff;

      .left-menu {
        width: 200px;
        background: #fafafa;
        border-right: 1px solid #eee;

        .menu-item {
          padding: 10px 14px;
          font-size: 14px;
          color: #333;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;

          &:hover {
            background: #fff;
            color: #e1251b;
          }
          &.active {
            background: #fff;
            font-weight: 600;
            color: #e1251b;
          }
          .arrow {
            color: #bbb;
          }
        }
      }

      .right-panel {
        flex: 1;
        padding: 12px 16px;

        .panel-section {
          display: flex;
          align-items: flex-start;
          padding: 6px 0;

          .section-title {
            width: 110px;
            color: #999;
            font-weight: 500;
          }

          .section-links {
            flex: 1;
            a {
              margin-right: 14px;
              color: #333;
              line-height: 24px;
              &:hover { color: #e1251b; }
              &.active { color: #e1251b; font-weight: 600; }
            }
          }
        }

        .panel-section.tags {
          border-top: 1px dashed #eee;
          margin-top: 6px;
          padding-top: 10px;
        }
      }
    }
    
    .choice-table {
      .pagination {
        margin-top: 20px;
        text-align: center;
      }
    }
    
    .loading {
      text-align: center;
      padding: 50px;
    }
  }

  /* 使用 deep 选择器，确保表格单元格内渲染的节点也能命中样式 */
  /deep/ .difficulty-tag {
    display: inline-block;
    padding: 2px 10px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
    border: 1px solid transparent;
  }
  /deep/ .difficulty-tag.easy {
    background: #f6ffed !important;
    color: #52c41a !important;
    border-color: #b7eb8f !important;
  }
  /deep/ .difficulty-tag.medium {
    background: #fff7e6 !important;
    color: #fa8c16 !important;
    border-color: #ffd591 !important;
  }
  /deep/ .difficulty-tag.hard {
    background: #fff2f0 !important;
    color: #f5222d !important;
    border-color: #ffb3b3 !important;
  }

  /deep/ .ivu-table-tbody tr {
    cursor: pointer;
    
    &:hover {
      background-color: #f5f7fa;
    }
  }
}
</style>