<script>
    export let size = '24px';
    export let color = 'currentColor';
    export let thickness = '2px';
</script>

<div class="spinner" style="width: {size}; height: {size}; border-width: {thickness}; border-color: {color}"></div>

<style>
    .spinner {
        display: inline-block;
        border-style: solid;
        border-radius: 50%;
        border-top-color: transparent !important;
        animation: spin 1s linear infinite;
        border-color: rgba(255, 255, 255, 0.3);
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }
</style>
