// Keep stored role identifiers stable so existing accounts retain their permissions.
export const roleLabel = (role: string) => ({
  "مشرف سلوكي": "مشرف",
  "مرشد طلابي": "منسق شؤون الطلاب",
  "المرشد الطلابي": "منسق شؤون الطلاب",
}[role] || role);
