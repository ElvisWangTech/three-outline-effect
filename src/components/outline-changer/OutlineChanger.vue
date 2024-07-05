<template>
  <div class="om-container">
    <select name="outlineModeSel" id="outlineModeSel" @change="handleModeChange">
      <option value="Material">材质模式</option>
      <option value="MaterialOutline">材质+线框模式</option>
    </select>
  </div>
</template>
<script lang="ts" setup>
const emits = defineEmits(['onChange']);
const handleModeChange = (e: Event) => {
  const sel = e.target as HTMLSelectElement;
  const val = sel?.value;
  console.log('val: ', val);
  emits('onChange', val);
};
</script>
<style scoped>
.om-container {
  line-height: 40px;
  bottom: 20px;
  height: 40px;
  box-sizing: content-box;
  left: 520px !important;
  padding-top: 0;
  position: fixed;
  z-index: 1;
}
</style>
