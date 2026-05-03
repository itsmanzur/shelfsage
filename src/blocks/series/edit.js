import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { PanelBody, SelectControl, Spinner, Placeholder } from '@wordpress/components';

export default function Edit({ attributes, setAttributes }) {
    const { seriesId, align } = attributes;

    // Retrieve the list of active series terms
    const seriess = useSelect((select) => {
        return select('core').getEntityRecords('taxonomy', 'rmss_series', { per_page: 50, _embed: true });
    }, []);

    const blockProps = useBlockProps({
        className: `shelfsage-series-block-wrapper align${align}`,
    });

    if (!seriess) {
        return (
            <div {...blockProps}>
                <Placeholder icon="book-alt" label={__('Loading seriess...', 'shelfsage')}>
                    <Spinner />
                </Placeholder>
            </div>
        );
    }

    const seriesOptions = [
        { value: 0, label: __('Select an series', 'shelfsage') },
        ...seriess.map((series) => ({ value: series.id, label: series.name })),
    ];

    const selectedseries = seriess.find((a) => a.id === seriesId);

    return (
        <>
            <InspectorControls>
                <PanelBody title={__('series Settings', 'shelfsage')}>
                    <SelectControl
                        label={__('Select series', 'shelfsage')}
                        value={seriesId}
                        options={seriesOptions}
                        onChange={(val) => setAttributes({ seriesId: parseInt(val, 10) })}
                        __nextHasNoMarginBottom
                        __next40pxDefaultSize
                    />
                </PanelBody>
            </InspectorControls>

            <div {...blockProps}>
                {seriesId === 0 ? (
                    <Placeholder icon="book-alt" label={__('ShelfSage series', 'shelfsage')} instructions={__('Select an series from the sidebar settings.', 'shelfsage')}>
                        <SelectControl
                            value={seriesId}
                            options={seriesOptions}
                            onChange={(val) => setAttributes({ seriesId: parseInt(val, 10) })}
                            __nextHasNoMarginBottom
                            __next40pxDefaultSize
                        />
                    </Placeholder>
                ) : selectedseries ? (
                    <div className="shelfsage-series-preview" style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', background: '#f9f9f9', display: 'flex', gap: '20px', alignItems: 'center' }}>
                        <div style={{ flex: 1 }}>
                            <h3 style={{ margin: '0 0 10px 0', fontSize: '1.2rem', color: '#1e293b' }}>{selectedseries.name}</h3>
                            {selectedseries.description && (
                                <div style={{ fontSize: '0.9rem', color: '#64748b' }} dangerouslySetInnerHTML={{ __html: selectedseries.description }} />
                            )}
                            <div style={{ marginTop: '10px', display: 'inline-block', background: '#e2e8f0', color: '#475569', fontSize: '11px', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                                Book series
                            </div>
                        </div>
                        {/* The Image is handled server-side via meta, in Gutenberg REST we'd need a custom endpoint, so we show a placeholder for the image in editor */}
                        <div style={{ width: '80px', height: '80px', background: '#cbd5e1', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '24px' }}>
                            👤
                        </div>
                    </div>
                ) : (
                    <Placeholder icon="book-alt" label={__('series Not Found', 'shelfsage')} />
                )}
            </div>
        </>
    );
}

