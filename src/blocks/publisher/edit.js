import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { PanelBody, SelectControl, Spinner, Placeholder } from '@wordpress/components';

export default function Edit({ attributes, setAttributes }) {
    const { publisherId, align } = attributes;

    // Retrieve the list of active publisher terms
    const publishers = useSelect((select) => {
        return select('core').getEntityRecords('taxonomy', 'rmss_publisher', { per_page: 50, _embed: true });
    }, []);

    const blockProps = useBlockProps({
        className: `shelfsage-publisher-block-wrapper align${align}`,
    });

    if (!publishers) {
        return (
            <div {...blockProps}>
                <Placeholder icon="building" label={__('Loading publishers...', 'shelfsage')}>
                    <Spinner />
                </Placeholder>
            </div>
        );
    }

    const publisherOptions = [
        { value: 0, label: __('Select an publisher', 'shelfsage') },
        ...publishers.map((publisher) => ({ value: publisher.id, label: publisher.name })),
    ];

    const selectedpublisher = publishers.find((a) => a.id === publisherId);

    return (
        <>
            <InspectorControls>
                <PanelBody title={__('publisher Settings', 'shelfsage')}>
                    <SelectControl
                        label={__('Select publisher', 'shelfsage')}
                        value={publisherId}
                        options={publisherOptions}
                        onChange={(val) => setAttributes({ publisherId: parseInt(val, 10) })}
                        __nextHasNoMarginBottom
                        __next40pxDefaultSize
                    />
                </PanelBody>
            </InspectorControls>

            <div {...blockProps}>
                {publisherId === 0 ? (
                    <Placeholder icon="building" label={__('ShelfSage publisher', 'shelfsage')} instructions={__('Select an publisher from the sidebar settings.', 'shelfsage')}>
                        <SelectControl
                            value={publisherId}
                            options={publisherOptions}
                            onChange={(val) => setAttributes({ publisherId: parseInt(val, 10) })}
                            __nextHasNoMarginBottom
                            __next40pxDefaultSize
                        />
                    </Placeholder>
                ) : selectedpublisher ? (
                    <div className="shelfsage-publisher-preview" style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', background: '#f9f9f9', display: 'flex', gap: '20px', alignItems: 'center' }}>
                        <div style={{ flex: 1 }}>
                            <h3 style={{ margin: '0 0 10px 0', fontSize: '1.2rem', color: '#1e293b' }}>{selectedpublisher.name}</h3>
                            {selectedpublisher.description && (
                                <div style={{ fontSize: '0.9rem', color: '#64748b' }} dangerouslySetInnerHTML={{ __html: selectedpublisher.description }} />
                            )}
                            <div style={{ marginTop: '10px', display: 'inline-block', background: '#e2e8f0', color: '#475569', fontSize: '11px', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                                Book publisher
                            </div>
                        </div>
                        {/* The Image is handled server-side via meta, in Gutenberg REST we'd need a custom endpoint, so we show a placeholder for the image in editor */}
                        <div style={{ width: '80px', height: '80px', background: '#cbd5e1', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '24px' }}>
                            👤
                        </div>
                    </div>
                ) : (
                    <Placeholder icon="building" label={__('publisher Not Found', 'shelfsage')} />
                )}
            </div>
        </>
    );
}

