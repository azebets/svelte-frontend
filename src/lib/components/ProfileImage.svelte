<script>
  import { user } from "$lib/store/profile";
  import { loading } from "$lib/store/activities";
  
  export let profile_picture;
  export let handleSaved;
  export let previewImage;
  export let isEdit;
  
  let loadImage = false;
</script>

<div class="profile-image-container">
  <input 
    type="file" 
    accept="image/*" 
    on:change={previewImage} 
    class="LsnnejkJ"
  />
  
  {#if isEdit}
    <button 
      on:click={handleSaved} 
      class="button iWksniw css-vmbe4r"
    >
      {#if loadImage}
        Loading...
      {:else}
        Save
      {/if}
    </button>
  {/if}
  
  <!-- Rest of your profile image template -->
</div>

<style>
  .profile-image-container {
    position: relative;
    width: 100%;
    max-width: 200px;
  }
</style>