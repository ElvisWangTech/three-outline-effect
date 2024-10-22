<script setup lang="ts">
import * as THREE from 'three';


  const props = defineProps({
    action: THREE.AnimationAction
  })
  const emits = defineEmits(['toggleHouse', 'toggleFloor', 'toggleAnimation'])
  const changeAnimation = (e: any) => {
    const checked = e.target.checked;
    emits('toggleAnimation', checked)
    
  }

  const toggleHouse = (e: any) => {
    const checked = e.target.checked;
    emits('toggleHouse', checked)
  }

  const toggleFloor = (e: any) => {
    const checked = e.target.checked;
    emits('toggleFloor', checked)
  }

</script>

<template>
  <fieldset class="control-box">
    <legend>工具箱:</legend>

    <div class="control-bar">
      <input type="checkbox" id="animationChx" name="animationChx" @change="changeAnimation"/>
      <label for="animationChx">是否动画</label>
    </div>

    <div class="control-bar">
      <input type="checkbox" id="houseChx" name="houseChx" @change="toggleHouse"/>
      <label for="houseChx">显示房子</label>
    </div>

    <div class="control-bar">
      <input type="checkbox" id="floorChx" name="floorChx" @change="toggleFloor"/>
      <label for="floorChx">显示模拟地面</label>
    </div>

  </fieldset>
</template>

<style lang="css" scoped>
.control-box {
  position: absolute; 
  bottom: 200px;
  right: 12px;
}
.control-bar * {
  cursor: pointer;
  user-select: none;
}
</style>