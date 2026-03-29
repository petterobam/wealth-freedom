<template>
  <el-tooltip
    :content="content"
    placement="right"
    :width="tooltipWidth"
  >
    <el-icon class="help-icon" :size="iconSize">
      <QuestionFilled />
    </el-icon>
  </el-tooltip>
</template>

<script setup lang="ts">
import { QuestionFilled } from '@element-plus/icons-vue'

interface Props {
  content: string
  tooltipWidth?: number
  iconSize?: number
}

withDefaults(defineProps<Props>(), {
  tooltipWidth: 300,
  iconSize: 16
})
</script>

<style scoped>
.help-icon {
  color: var(--el-color-primary);
  cursor: help;
  margin-left: 8px;
  vertical-align: middle;
  transition: all 0.3s ease;
}

.help-icon:hover {
  color: var(--el-color-primary-dark-2);
  transform: scale(1.1);
}
</style>
