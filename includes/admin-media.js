jQuery(function ($) {
    var imageFrame;
    var currentTargetInput = null;

    $(document).on('click', '.rmss-upload-btn', function (e) {
        e.preventDefault();
        currentTargetInput = $(this).data('target');

        if (!imageFrame) {
            imageFrame = wp.media({
                title: 'Select Media',
                multiple: false,
                library: {
                    type: 'application/pdf,image'
                }
            });

            imageFrame.on('select', function () {
                var selection = imageFrame.state().get('selection');
                var attachment = selection.first();
                if (!attachment || !currentTargetInput) {
                    return;
                }

                var url = attachment.get('url') || '';
                $('#' + currentTargetInput).val(url);
            });
        }

        imageFrame.open();
    });
});
