import { ref} from 'vue'
import { defineStore } from 'pinia'

export const useListStore = defineStore('list', () => {
  const startIndex = ref(0)
  const endIndex = ref(0)
  const updateIndex = (s,e)=>{
    startIndex.value = s
    endIndex.value = e
  }

  return { startIndex,endIndex,updateIndex }
},
{
  persist: true
}
)
