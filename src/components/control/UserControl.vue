<script setup lang="ts">
import * as THREE from 'three';


  const props = defineProps({
    action: THREE.AnimationAction
  })
  const changeAnimation = (e: any) => {
    const checked = e.target.checked;
    if (checked) {
      props.action?.play()
    } else {
      props.action?.stop()
    }
  }
</script>

<template>
  <fieldset style="position: absolute; bottom: 200px;right: 12px;">
    <legend>工具箱:</legend>

    <div>
      <input type="checkbox" id="animationChx" name="animation" checked @change="changeAnimation"/>
      <label for="animation">是否动画</label>
    </div>

  </fieldset>
</template>