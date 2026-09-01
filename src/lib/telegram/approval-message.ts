export type ApprovalPurchaseKind = "course" | "bundle";

export function buildPaymentApprovedInviteMessage(input: {
  studentName: string;
  itemTitle: string;
  inviteLink: string;
  kind: ApprovalPurchaseKind;
}): string {
  const name = input.studentName.trim() || "ተማሪ";
  const title = input.itemTitle.trim() || (input.kind === "bundle" ? "Bundle" : "Course");
  const purchaseLine =
    input.kind === "bundle"
      ? `📚 Your Purchased Bundle: ${title}`
      : `📚 Your Purchased Course: ${title}`;

  return [
    `ሰላም ${name} 👋`,
    "የMagster ክፍያዎ በተሳካ ሁኔታ Approve ተደርጓል! ✅",
    purchaseLine,
    "",
    `🔗 Private Invite Link ፡ ${input.inviteLink}`,
    "",
    "⚠️ ጠቃሚ ማሳሰቢያ፡",
    "",
    "ይህ ሊንክ የሚያገለግለው ለአንድ ጊዜ መግቢያ ብቻ ነው።",
    "ሊንኩን ለሌላ ሰው አያጋሩ (አንዴ ሌላ ሰው ከተጠቀመበት ለእርስዎ አይሰራም)።",
    "ሊንኩን አሁኑኑ ተጭነው ቻናሉን ይቀላቀሉ (Join ያድርጉ)።",
    "መልካም የትምህርት ጊዜ ይሁንልዎ! 🎓✨",
  ].join("\n");
}
