<script setup lang="ts">
  const emits = defineEmits(['toggleHouse', 'toggleFloor', 'toggleAnimation', 'toggleCabinetMerge', 'toggleSingleSofa', 'toggleTwoPeopleSofa'])
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

  const toggleCabinetMerge = (e: any) => {
    const checked = e.target.checked;
    emits('toggleCabinetMerge', checked)
  }

  const toggleSingleSofa = (e: any) => {
    const checked = e.target.checked;
    emits('toggleSingleSofa', checked)
  }

  const toggleTwoPeopleSofa = (e: any) => {
    const checked = e.target.checked;
    emits('toggleTwoPeopleSofa', checked)
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

    <div class="control-bar">
      <input type="checkbox" id="singleSofaChx" name="singleSofaChx" checked @change="toggleSingleSofa"/>
      <label for="singleSofaChx">显示单人沙发</label>
    </div>

    <div class="control-bar">
      <input type="checkbox" id="twoPeopleSofaChx" name="twoPeopleSofaChx" checked @change="toggleTwoPeopleSofa"/>
      <label for="twoPeopleSofaChx">显示双人沙发</label>
    </div>

    <div class="control-bar">
      <input type="checkbox" id="cabineMergeChx" name="cabineMergeChx" @change="toggleCabinetMerge"/>
      <label for="cabineMergeChx">合并柜子</label>
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
}
</style>