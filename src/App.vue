<script setup lang="ts">
import { OutlineComposor } from './outline/OutlineComposor'
import { onBeforeUnmount, onMounted } from 'vue';
import OutlineChanger from './components/outline-changer/OutlineChanger.vue'
import UserControl from './components/control/UserControl.vue'
import { OutlineMode } from './types/index'
import { useConditionalModel } from './composables/conditional-line/useConditionalModel';
import { useOutlineComposer } from './composables/outline/useOutlineComposer';
import { useSceneLoader } from './composables/loader/useSceneLoader';
import { useConditionalPanelParams } from './composables/conditional-line/useConditionalPanelParams';
import { AnimationMixer } from 'three';
import { mergeObject } from './lib/mergeObjet';

let composer: OutlineComposor | undefined

let mixer: AnimationMixer | undefined

let outlineMode: OutlineMode

let gui: dat.GUI

const {sceneMembers, init, container} = useSceneLoader()

const outlineComposerMgr = useOutlineComposer()

const {initGui, params} = useConditionalPanelParams()

const conditionalModelMgr = useConditionalModel(sceneMembers, params);

function restoreOutlineComposer() {
  if (composer) {
      composer.restoreObjs();
      composer.removeSurfaceIdAttribute([sceneMembers.sofa, sceneMembers.sofa2, sceneMembers.torus, sceneMembers.cabinet]);
    }
    composer = undefined
}

function changeOutlineMode(mode: OutlineMode) {
  conditionalModelMgr.removeConditionalModels()
  conditionalModelMgr.removeEdgesModels()
  gui.hide()
  if (mode === OutlineMode.Material) {
    restoreOutlineComposer()
    conditionalModelMgr.removeConditionalModels()
    conditionalModelMgr.removeEdgesModels()
    
  } else if (mode === OutlineMode.MaterialOutline) {
    // 只添加沙发模型
    composer = sceneMembers.composer
    composer?.applyOutline([sceneMembers.sofa, sceneMembers.cabinet])
    composer?.addSurfaceIdAttributeToMesh([sceneMembers.sofa, sceneMembers.sofa2, sceneMembers.torus, sceneMembers.cabinet])
  } else if (mode === OutlineMode.MaterialOutline1) {
    restoreOutlineComposer()
    conditionalModelMgr.initEdgesModel(sceneMembers.cabinet)
    conditionalModelMgr.initEdgesModel(sceneMembers.sofa)
    conditionalModelMgr.initConditionalModel(sceneMembers.cabinet)
    conditionalModelMgr.initConditionalModel(sceneMembers.sofa)
    gui.show()

  }
  outlineMode = mode;
}

function animate() {

  requestAnimationFrame(animate);

  sceneMembers.stats.begin();

  sceneMembers.controls?.update();

  mixer?.update(0.06);

  if (composer) {
    composer.render();
  } else {
    sceneMembers.renderer.clear();
    sceneMembers.renderer.render(sceneMembers.scene, sceneMembers.camera)
  }

  sceneMembers.stats.end();

}

function onWindowResize() {
  conditionalModelMgr.updateConditionalModels()
  conditionalModelMgr.updateEdgeModels()
}

const toggleHouse = (visible: boolean) => {
  sceneMembers.house.visible = visible
}

const toggleFloor = (visible: boolean) => {
  sceneMembers.floorGroup.visible = visible
}

const toggleAnimation = (active: boolean) => {
  if (active) {
      sceneMembers.action?.play()
      mixer = sceneMembers.mixer
    } else {
      // sceneMembers.action?.stop()
      mixer = undefined
    }
}

const toggleCabinetMerge = (active: boolean) => {
  if (active) {
    const mergedCabinet = mergeObject(sceneMembers.cabinet)
    mergedCabinet.name = sceneMembers.cabinet.name;
    sceneMembers.mergedCabinet = mergedCabinet
    sceneMembers.cabinet.parent?.remove(sceneMembers.cabinet)
    sceneMembers.obj3d.add(mergedCabinet)
  } else {
    sceneMembers.mergedCabinet.parent?.remove(sceneMembers.mergedCabinet)
    sceneMembers.obj3d.add(sceneMembers.cabinet)
  }
}

const toggleSingleSofa = (visible: boolean) => {
  sceneMembers.sofa.visible = visible
}

const toggleTwoPeopleSofa = (visible: boolean) => {
  sceneMembers.sofa2.visible = visible
}

onMounted(() => {
  init();
  outlineComposerMgr.init(sceneMembers)
  animate();
  window.sceneMembers = sceneMembers;
  window.addEventListener('resize', onWindowResize, false)
  gui = initGui(conditionalModelMgr.onParamChange)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', onWindowResize, false)
})
</script>

<template>
  <div ref="container">

  </div>
  <OutlineChanger @on-change="changeOutlineMode"/>
  <UserControl 
    @toggle-house="toggleHouse" 
    @toggle-animation="toggleAnimation"
    @toggle-floor="toggleFloor"
    @toggle-cabinet-merge="toggleCabinetMerge"
    @toggle-single-sofa="toggleSingleSofa"
    @toggle-two-people-sofa="toggleTwoPeopleSofa"
  />
</template>
