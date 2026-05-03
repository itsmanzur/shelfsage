import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { PanelBody, SelectControl, Spinner, Placeholder } from '@wordpress/components';

export default function Edit({ attributes, setAttributes }) {
    const { translatorId, align } = attributes;

    // Retrieve the list of active translator terms
    const translators = useSelect((select) => {
        return select('core').getEntityRecords('taxonomy', 'rmss_translator', { per_page: 50, _embed: true });
    }, []);

    const blockProps = useBlockProps({
        className: `shelfsage-translator-block-wrapper align${align}`,
    });

    if (!translators) {
        return (
            <div {...blockProps}>
                <Placeholder icon="translation" label={__('Loading translators...', 'shelfsage')}>
                    <Spinner />
                </Placeholder>
            </div>
        );
    }

    const translatorOptions = [
        { value: 0, label: __('Select an translator', 'shelfsage') },
        ...translators.map((translator) => ({ value: translator.id, label: translator.name })),
    ];

    const selectedtranslator = translators.find((a) => a.id === translatorId);

    return (
        <>
            <InspectorControls>
                <PanelBody title={__('translator Settings', 'shelfsage')}>
                    <SelectControl
                        label={__('Select translator', 'shelfsage')}
                        value={translatorId}
                        options={translatorOptions}
                        onChange={(val) => setAttributes({ translatorId: parseInt(val, 10) })}
                        __nextHasNoMarginBottom
                        __next40pxDefaultSize
                    />
                </PanelBody>
            </InspectorControls>

            <div {...blockProps}>
                {translatorId === 0 ? (
                    <Placeholder icon="translation" label={__('ShelfSage translator', 'shelfsage')} instructions={__('Select an translator from the sidebar settings.', 'shelfsage')}>
                        <SelectControl
                            value={translatorId}
                            options={translatorOptions}
                            onChange={(val) => setAttributes({ translatorId: parseInt(val, 10) })}
                            __nextHasNoMarginBottom
                            __next40pxDefaultSize
                        />
                    </Placeholder>
                ) : selectedtranslator ? (
                    <div className="shelfsage-translator-preview" style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', background: '#f9f9f9', display: 'flex', gap: '20px', alignItems: 'center' }}>
                        <div style={{ flex: 1 }}>
                            <h3 style={{ margin: '0 0 10px 0', fontSize: '1.2rem', color: '#1e293b' }}>{selectedtranslator.name}</h3>
                            {selectedtranslator.description && (
                                <div style={{ fontSize: '0.9rem', color: '#64748b' }} dangerouslySetInnerHTML={{ __html: selectedtranslator.description }} />
                            )}
                            <div style={{ marginTop: '10px', display: 'inline-block', background: '#e2e8f0', color: '#475569', fontSize: '11px', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                                Book translator
                            </div>
                        </div>
                        {/* The Image is handled server-side via meta, in Gutenberg REST we'd need a custom endpoint, so we show a placeholder for the image in editor */}
                        <div style={{ width: '80px', height: '80px', background: '#cbd5e1', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '24px' }}>
                            👤
                        </div>
                    </div>
                ) : (
                    <Placeholder icon="translation" label={__('translator Not Found', 'shelfsage')} />
                )}
            </div>
        </>
    );
}

