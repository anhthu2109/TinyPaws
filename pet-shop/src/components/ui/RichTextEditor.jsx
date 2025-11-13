import { Editor } from '@tinymce/tinymce-react';
import './RichTextEditor.css';

const RichTextEditor = ({ 
    value, 
    onChange, 
    placeholder = "Nhập nội dung...", 
    height = 300,
    disabled = false 
}) => {
    const handleEditorChange = (content) => {
        onChange(content);
    };

    return (
        <div className="border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-colors">
            <Editor
                apiKey="no-api-key" // Sử dụng free version
                value={value}
                onEditorChange={handleEditorChange}
                disabled={disabled}
                init={{
                    height: height,
                    menubar: false,
                    plugins: [
                        'advlist', 'autolink', 'lists', 'link', 'image', 'charmap',
                        'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                        'insertdatetime', 'media', 'table', 'preview', 'help', 'wordcount'
                    ],
                    toolbar: 'undo redo | blocks | ' +
                        'bold italic forecolor | alignleft aligncenter ' +
                        'alignright alignjustify | bullist numlist outdent indent | ' +
                        'removeformat | link image | help',
                    content_style: `
                        body { 
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; 
                            font-size: 14px; 
                            line-height: 1.6; 
                            padding: 16px;
                        }
                    `,
                    placeholder: placeholder,
                    branding: false,
                    promotion: false,
                    skin: 'oxide',
                    content_css: 'default',
                    toolbar_mode: 'sliding',
                    resize: false,
                    statusbar: false,
                    setup: (editor) => {
                        editor.on('focus', () => {
                            editor.getContainer().parentElement.classList.add('ring-2', 'ring-blue-500', 'border-blue-500');
                        });
                        editor.on('blur', () => {
                            editor.getContainer().parentElement.classList.remove('ring-2', 'ring-blue-500', 'border-blue-500');
                        });
                    }
                }}
            />
        </div>
    );
};

export default RichTextEditor;
