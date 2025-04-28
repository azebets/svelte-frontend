<script>
  import { onMount } from 'svelte';
  
  export let text = '';
  export let size = 150;
  export let bgColor = '#ffffff';
  export let fgColor = '#000000';
  export let level = 'L';
  export let includeMargin = true;
  
  let qrCodeElement;
  
  onMount(async () => {
    if (text) {
      const QRCodeStyling = (await import('qr-code-styling')).default;
      
      const qrCode = new QRCodeStyling({
        width: size,
        height: size,
        type: 'svg',
        data: text,
        dotsOptions: {
          color: fgColor,
          type: 'rounded'
        },
        backgroundOptions: {
          color: bgColor,
        },
        cornersSquareOptions: {
          type: 'extra-rounded'
        },
        cornersDotOptions: {
          type: 'dot'
        },
        margin: includeMargin ? 10 : 0,
        qrOptions: {
          errorCorrectionLevel: level
        }
      });
      
      qrCode.append(qrCodeElement);
    }
  });
</script>

<div bind:this={qrCodeElement} class="qr-code-container"></div>

<style>
  .qr-code-container {
    display: flex;
    justify-content: center;
    align-items: center;
  }
</style>
