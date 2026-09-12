import fs from 'node:fs';
const p='src/presence/UserModal.tsx';let s=fs.readFileSync(p,'utf8');
s='import "./user-modal.css";\n'+s;
s=s.replace('export function UserModal', 'const teachingSubjects = ["اللغة العربية", "اللغة الإنجليزية", "الشرعية", "الحاسوب", "الرياضيات", "الفيزياء", "الكيمياء", "الأحياء", "تاريخ", "جغرافيا", "اجتماعيات", "مهارات حياتية"];\n\nexport function UserModal');
s=s.replace('  const [active, setActive]', '  const [customSubject, setCustomSubject] = useState(!!user?.teachingSubject && !teachingSubjects.includes(user.teachingSubject));\n  const [active, setActive]');
s=s.replace('className="modal-backdrop"', 'className="modal-backdrop user-modal-backdrop"').replace('className="modal-box"', 'className="modal-box user-modal" role="dialog" aria-modal="true" aria-labelledby="user-modal-title"').replace('<h4><UserPlus', '<h4 id="user-modal-title"><UserPlus').replace('className="icon-btn" onClick={onClose}', 'className="icon-btn" aria-label="إغلاق" onClick={onClose}');
const start=s.indexOf('          {isTeacher && <label');const end=s.indexOf('\n',start);
s=s.slice(0,start)+`          {isTeacher && <div className="user-subject-field">
            <label className="field-label" htmlFor="teacher-subject">المادة التي يدرسها المعلم <span aria-hidden="true">*</span></label>
            <select id="teacher-subject" className="select-input" value={customSubject ? "other" : teachingSubject} onChange={e => { setCustomSubject(e.target.value === "other"); setTeachingSubject(e.target.value === "other" ? "" : e.target.value); }}>
              <option value="">اختر المادة</option>
              {teachingSubjects.map(subject => <option key={subject} value={subject}>{subject}</option>)}
              <option value="other">مادة أخرى</option>
            </select>
            {customSubject && <input className="text-input" aria-label="اسم المادة الأخرى" value={teachingSubject} maxLength={100} onChange={e => setTeachingSubject(e.target.value)} placeholder="اكتب اسم المادة" />}
            <p className="char-hint">تظهر تلقائيًا في التقييم الدوري ونقاط الحصة.</p>
          </div>}`+s.slice(end);
s=s.replace('          <button\r\n            className="submit-btn"', '        </div>\n        <div className="user-modal-footer">\n          {!canSave && <p className="char-hint" role="status">أكمل الاسم والبريد الإلكتروني{!user && " وكلمة المرور"}{isTeacher && " وحدد المادة وصفًا/شعبة واحدة على الأقل"} لتفعيل الحفظ.</p>}\n          <div className="user-modal-actions">\n          <button\n            className="submit-btn"');
s=s.replace('            <Save size={16} /> حفظ','            <Save size={16} /> {user ? "حفظ التعديلات" : "إضافة مستخدم جديد"}');
s=s.replace('          </button>\r\n        </div>\r\n      </div>', '          </button>\n          <button type="button" className="chip-btn-outline" onClick={onClose}>إلغاء</button>\n          </div>\n        </div>\n      </div>');
fs.writeFileSync(p,s);
