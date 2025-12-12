import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { wikiContent } from '../data/wikiContent';
import { Info, AlertCircle, ChevronRight, Download } from 'lucide-react';

const WikiPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const page = wikiContent.find((p) => p.id === id);

  if (!page) return <Navigate to="/" replace />;

  const PageIcon = page.icon;

  return (
    <div className="max-w-5xl mx-auto animate-fadeIn">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <span>Home</span>
        <ChevronRight size={14} />
        <span>Policy</span>
        <ChevronRight size={14} />
        <span className="font-medium text-slate-800">{page.title}</span>
      </div>

      {/* Page Header */}
      <div className="mb-8 border-b border-slate-200 pb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="bg-blue-100 text-blue-700 p-3 rounded-xl">
            <PageIcon size={32} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">{page.title}</h1>
        </div>
        <p className="text-lg text-slate-600 max-w-3xl leading-relaxed">{page.summary}</p>
      </div>

      {/* Page Content */}
      <div className="space-y-8">
        {page.sections.map((section, index) => (
          <div key={index} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">{section.title}</h2>
            </div>

            <div className="p-6">
              {/* Content */}
              {section.type === 'list' && Array.isArray(section.content) ? (
                <ul className="space-y-3">
                  {section.content.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-slate-700">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2.5 flex-shrink-0"></span>
                      <span className="leading-relaxed">{typeof item === 'string' ? item : item.label}</span>
                    </li>
                  ))}
                </ul>
              ) : section.type === 'info' ? (
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-4">
                  <Info className="text-blue-600 flex-shrink-0" size={24} />
                  <div className="text-blue-900 text-sm leading-relaxed">
                    {Array.isArray(section.content) ? (
                      <ul className="list-disc pl-4 space-y-1">{section.content.map((c, i) => <li key={i}>{typeof c === 'string' ? c : c.label}</li>)}</ul>
                    ) : section.content}
                  </div>
                </div>
              ) : section.type === 'warning' ? (
                <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 flex gap-4">
                  <AlertCircle className="text-amber-600 flex-shrink-0" size={24} />
                  <div className="text-amber-900 text-sm leading-relaxed font-medium">
                     {typeof section.content === 'string' ? section.content : 
                      Array.isArray(section.content) ? section.content.map(c => typeof c === 'string' ? c : c.label).join(' ') : ''}
                  </div>
                </div>
              ) : section.type === 'table' && Array.isArray(section.content) ? (
                 <table className="w-full table-auto border-collapse border border-slate-200 mt-4">
                  <tbody>
                    {section.content.map((row, idx) => {
                      const label = typeof row === 'string' ? row : row.label;
                      const link = typeof row === 'string' ? null : row.link;

                      return (
                        <tr key={idx} className="border border-slate-200">
                          <td className="border border-slate-200 px-4 py-2">{label}</td>
                          {link && (
                            <td className="border border-slate-200 px-4 py-2 text-right">
                              <button
                                onClick={() => {
                                  const a = document.createElement('a');
                                  a.href = link;
                                  a.download = label; // optional: filename
                                  a.click();
                                }}
                                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-sm font-medium transition-all shadow-md hover:shadow-lg active:scale-95"
                              >
                                Download
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {typeof section.content === 'string' ? section.content : 
                     Array.isArray(section.content) ? section.content.map(c => typeof c === 'string' ? c : c.label).join('\n') : ''}
                </p>
              )}
              
              {/* Images */}
              {section.images && section.images.length > 0 && (
                <div className="mt-6 space-y-4">
                  {section.images.map((img, idx) => (
                    <div key={idx} className="rounded-lg overflow-hidden border border-slate-200 shadow-sm">
                      <img
                        src={img}
                        alt={`${section.title} - ${idx + 1}`}
                        className="w-full h-auto object-cover max-h-[400px]"
                        loading="lazy"
                      />
                    </div>
                  ))}
                </div>
              )}
              
              {/* Download Buttons Container */}
              {(section.downloadLink || (section.additionalDownloads && section.additionalDownloads.length > 0)) && (
                <div className="mt-4 flex flex-wrap gap-3">
                  {/* Legacy Single Download Link */}
                  {section.downloadLink && (
                    <a
                      href={section.downloadLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-md hover:shadow-lg active:scale-95"
                      download
                    >
                      <Download size={16} />
                      {section.downloadLabel || 'Download File'}  
                    </a>
                  )}

                  {/* Additional Download Buttons */}
                  {section.additionalDownloads?.map((btn, i) => (
                    <a
                      key={i}
                      href={btn.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-md hover:shadow-lg active:scale-95"
                      download
                    >
                      <Download size={16} />
                      {btn.label}
                    </a>
                  ))}
                </div>
              )}

            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 mb-8 p-6 bg-slate-100 rounded-xl text-center">
        <p className="text-slate-500 text-sm">Always refer to the original FD-06 PDF document for official audits.</p>
      </div>
    </div>
  );
};

export default WikiPage;