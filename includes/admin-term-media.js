jQuery(function ($) {
    var rmssMediaFrame;

    function ensureFrame() {
        if (rmssMediaFrame) {
            return rmssMediaFrame;
        }

        rmssMediaFrame = wp.media({
            title: 'Select Image',
            button: { text: 'Use this image' },
            multiple: false,
            library: { type: 'image' }
        });

        rmssMediaFrame.on('select', function () {
            var selection = rmssMediaFrame.state().get('selection');
            var attachment = selection.first();
            if (!attachment) {
                return;
            }

            var data = attachment.toJSON();
            $('#rmss_term_image_id').val(data.id || '');

            if (data.url) {
                $('#rmss_term_image_wrapper').html('<img src="' + data.url + '" style="max-width:150px;border:1px solid #ccc;padding:2px;" />');
            }

            $('.rmss_media_remove, .rmss_media_remove_edit').show();
        });

        return rmssMediaFrame;
    }

    $(document).on('click', '.rmss_media_button, .rmss_media_button_edit', function (e) {
        e.preventDefault();
        ensureFrame().open();
    });

    $(document).on('click', '.rmss_media_remove, .rmss_media_remove_edit', function (e) {
        e.preventDefault();
        $('#rmss_term_image_id').val('');
        $('#rmss_term_image_wrapper').html('');
        $(this).hide();
    });
});
