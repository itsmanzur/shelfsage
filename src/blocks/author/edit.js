import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { PanelBody, SelectControl, Spinner, Placeholder } from '@wordpress/components';

export default function Edit({ attributes, setAttributes }) {
    const { authorId, align } = attributes;

    // Retrieve the list of active author terms
    const authors = useSelect((select) => {
        return select('core').getEntityRecords('taxonomy', 'rmss_author', { per_page: 50, _embed: true });
    }, []);

    const blockProps = useBlockProps({
        className: `shelfsage-author-block-wrapper align${align}`,
    });

    if (!authors) {
        return (
            <div {...blockProps}>
                <Placeholder icon="businessman" label={__('Loading Authors...', 'shelfsage')}>
                    <Spinner />
                </Placeholder>
            </div>
        );
    }

    const authorOptions = [
        { value: 0, label: __('Select an Author', 'shelfsage') },
        ...authors.map((author) => ({ value: author.id, label: author.name })),
    ];

    const selectedAuthor = authors.find((a) => a.id === authorId);

    return (
        <>
            <InspectorControls>
                <PanelBody title={__('Author Settings', 'shelfsage')}>
                    <SelectControl
                        label={__('Select Author', 'shelfsage')}
                        value={authorId}
                        options={authorOptions}
                        onChange={(val) => setAttributes({ authorId: parseInt(val, 10) })}
                        __nextHasNoMarginBottom
                        __next40pxDefaultSize
                    />
                </PanelBody>
            </InspectorControls>

            <div {...blockProps}>
                {authorId === 0 ? (
                    <Placeholder icon="businessman" label={__('ShelfSage Author', 'shelfsage')} instructions={__('Select an author from the sidebar settings.', 'shelfsage')}>
                        <SelectControl
                            value={authorId}
                            options={authorOptions}
                            onChange={(val) => setAttributes({ authorId: parseInt(val, 10) })}
                            __nextHasNoMarginBottom
                            __next40pxDefaultSize
                        />
                    </Placeholder>
                ) : selectedAuthor ? (
                    <div className="shelfsage-author-preview" style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', background: '#f9f9f9', display: 'flex', gap: '20px', alignItems: 'center' }}>
                        <div style={{ flex: 1 }}>
                            <h3 style={{ margin: '0 0 10px 0', fontSize: '1.2rem', color: '#1e293b' }}>{selectedAuthor.name}</h3>
                            {selectedAuthor.description && (
                                <div style={{ fontSize: '0.9rem', color: '#64748b' }} dangerouslySetInnerHTML={{ __html: selectedAuthor.description }} />
                            )}
                            <div style={{ marginTop: '10px', display: 'inline-block', background: '#e2e8f0', color: '#475569', fontSize: '11px', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                                Book Author
                            </div>
                        </div>
                        {/* The Image is handled server-side via meta, in Gutenberg REST we'd need a custom endpoint, so we show a placeholder for the image in editor */}
                        <div style={{ width: '80px', height: '80px', background: '#cbd5e1', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '24px' }}>
                            👤
                        </div>
                    </div>
                ) : (
                    <Placeholder icon="businessman" label={__('Author Not Found', 'shelfsage')} />
                )}
            </div>
        </>
    );
}
