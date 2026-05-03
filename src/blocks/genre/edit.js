import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { PanelBody, SelectControl, Spinner, Placeholder } from '@wordpress/components';

export default function Edit({ attributes, setAttributes }) {
    const { genreId, align } = attributes;

    // Retrieve the list of active genre terms
    const genres = useSelect((select) => {
        return select('core').getEntityRecords('taxonomy', 'rmss_genre', { per_page: 50, _embed: true });
    }, []);

    const blockProps = useBlockProps({
        className: `shelfsage-genre-block-wrapper align${align}`,
    });

    if (!genres) {
        return (
            <div {...blockProps}>
                <Placeholder icon="category" label={__('Loading genres...', 'shelfsage')}>
                    <Spinner />
                </Placeholder>
            </div>
        );
    }

    const genreOptions = [
        { value: 0, label: __('Select an genre', 'shelfsage') },
        ...genres.map((genre) => ({ value: genre.id, label: genre.name })),
    ];

    const selectedgenre = genres.find((a) => a.id === genreId);

    return (
        <>
            <InspectorControls>
                <PanelBody title={__('genre Settings', 'shelfsage')}>
                    <SelectControl
                        label={__('Select genre', 'shelfsage')}
                        value={genreId}
                        options={genreOptions}
                        onChange={(val) => setAttributes({ genreId: parseInt(val, 10) })}
                        __nextHasNoMarginBottom
                        __next40pxDefaultSize
                    />
                </PanelBody>
            </InspectorControls>

            <div {...blockProps}>
                {genreId === 0 ? (
                    <Placeholder icon="category" label={__('ShelfSage genre', 'shelfsage')} instructions={__('Select an genre from the sidebar settings.', 'shelfsage')}>
                        <SelectControl
                            value={genreId}
                            options={genreOptions}
                            onChange={(val) => setAttributes({ genreId: parseInt(val, 10) })}
                            __nextHasNoMarginBottom
                            __next40pxDefaultSize
                        />
                    </Placeholder>
                ) : selectedgenre ? (
                    <div className="shelfsage-genre-preview" style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', background: '#f9f9f9', display: 'flex', gap: '20px', alignItems: 'center' }}>
                        <div style={{ flex: 1 }}>
                            <h3 style={{ margin: '0 0 10px 0', fontSize: '1.2rem', color: '#1e293b' }}>{selectedgenre.name}</h3>
                            {selectedgenre.description && (
                                <div style={{ fontSize: '0.9rem', color: '#64748b' }} dangerouslySetInnerHTML={{ __html: selectedgenre.description }} />
                            )}
                            <div style={{ marginTop: '10px', display: 'inline-block', background: '#e2e8f0', color: '#475569', fontSize: '11px', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                                Book genre
                            </div>
                        </div>
                        {/* The Image is handled server-side via meta, in Gutenberg REST we'd need a custom endpoint, so we show a placeholder for the image in editor */}
                        <div style={{ width: '80px', height: '80px', background: '#cbd5e1', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '24px' }}>
                            👤
                        </div>
                    </div>
                ) : (
                    <Placeholder icon="category" label={__('genre Not Found', 'shelfsage')} />
                )}
            </div>
        </>
    );
}

