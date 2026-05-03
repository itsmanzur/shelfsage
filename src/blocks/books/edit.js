import { __ } from '@wordpress/i18n';
import { useState, useEffect, useCallback } from '@wordpress/element';
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { PanelBody, SelectControl, Placeholder, Spinner, Button } from '@wordpress/components';
import apiFetch from '@wordpress/api-fetch';
import BooksShortcode from '../../components/BooksShortcode.jsx';

export default function Edit({ attributes, setAttributes }) {
    const { shortcodeId } = attributes;
    const [shortcodes, setShortcodes] = useState([]);
    const [loading, setLoading] = useState(true);

    const blockProps = useBlockProps({
        className: 'shelfsage-books-block-wrapper',
    });

    const fetchShortcodes = useCallback((silent = false) => {
        if (!silent) setLoading(true);
        apiFetch({ path: '/shelfsage/v1/shortcodes' })
            .then((data) => {
                setShortcodes(Array.isArray(data) ? data : []);
            })
            .catch(() => setShortcodes([]))
            .finally(() => {
                if (!silent) setLoading(false);
            });
    }, []);

    useEffect(() => {
        fetchShortcodes();

        const handleFocus = () => fetchShortcodes(true);
        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [fetchShortcodes]);

    const options = [
        { value: 0, label: __('Select a ShelfSage Design', 'shelfsage') },
        ...shortcodes.map((sc) => ({
            value: sc.id,
            label: (sc.title || __('Shortcode', 'shelfsage')) + ' (#' + sc.id + ')',
        })),
    ];

    const selectedShortcode = shortcodes.find((s) => s.id === shortcodeId);
    const shortcodeSettings = selectedShortcode && selectedShortcode.settings ? selectedShortcode.settings : {};
    const dynamicCss = selectedShortcode && selectedShortcode.css ? selectedShortcode.css : '';

    if (loading && shortcodes.length === 0) {
        return (
            <div {...blockProps}>
                <Placeholder icon="book" label={__('ShelfSage Books', 'shelfsage')}>
                    <Spinner />
                </Placeholder>
            </div>
        );
    }

    return (
        <>
            <InspectorControls>
                <PanelBody title={__('ShelfSage Settings', 'shelfsage')} initialOpen={true}>
                    <SelectControl
                        label={__('Select Design', 'shelfsage')}
                        help={__(
                            'Choose a saved shortcode design from Shortcode Architect. Create designs at ShelfSage → Shortcode Architect.',
                            'shelfsage'
                        )}
                        value={shortcodeId}
                        options={options}
                        onChange={(val) => setAttributes({ shortcodeId: parseInt(val || 0, 10) })}
                        __nextHasNoMarginBottom
                        __next40pxDefaultSize
                    />
                    <div style={{ marginTop: '15px' }}>
                        <Button
                            variant="secondary"
                            isBusy={loading}
                            onClick={() => fetchShortcodes(false)}
                            style={{ width: '100%', justifyContent: 'center' }}
                        >
                            {__('Refresh Designs', 'shelfsage')}
                        </Button>
                        <p style={{ fontSize: '11px', color: '#666', marginTop: '6px', lineHeight: 1.3 }}>
                            {__('Click refresh or focus window if you recently updated your design in Shortcode Architect.', 'shelfsage')}
                        </p>
                    </div>
                </PanelBody>
            </InspectorControls>

            <div {...blockProps}>
                {shortcodeId === 0 ? (
                    <Placeholder
                        icon="book"
                        label={__('ShelfSage Books', 'shelfsage')}
                        instructions={__(
                            'Select a saved ShelfSage design from the block settings, or create one in ShelfSage → Shortcode Architect.',
                            'shelfsage'
                        )}
                    >
                        <SelectControl
                            value={shortcodeId}
                            options={options}
                            onChange={(val) => setAttributes({ shortcodeId: parseInt(val || 0, 10) })}
                            __nextHasNoMarginBottom
                            __next40pxDefaultSize
                        />
                    </Placeholder>
                ) : (
                    <div className="shelfsage-books-live-preview">
                        {dynamicCss && <style dangerouslySetInnerHTML={{ __html: dynamicCss }} />}
                        <div className={`rmss-books-container rmss-design-${shortcodeId}`}>
                            <BooksShortcode id={String(shortcodeId)} {...shortcodeSettings} />
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
