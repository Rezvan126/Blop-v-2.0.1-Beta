import { useState } from "react";
import { useLocation } from "wouter";
import { UserPlus, Archive, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useBlopStore } from "@/lib/store";
import {
  Screen, ScrollArea, AppHeader, SettingsSection, SettingsRow,
  Avatar, SectionLabel,
} from "@/components/ds";

interface Props { params: { id: string } }

export default function GroupSettingsScreen({ params }: Props) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const {
    groups, members, getGroupMembers, updateGroup,
    addMemberToGroup, removeMemberFromGroup, getGroupMeId, setGroupMe, settings,
  } = useBlopStore();
  const group        = groups[params.id];
  const groupMembers = getGroupMembers(params.id);
  const meId         = getGroupMeId(params.id);

  const [groupName,         setGroupName]         = useState(group?.name ?? "");
  const [newMemberName,     setNewMemberName]     = useState("");
  const [memberToRemove,    setMemberToRemove]    = useState<string | null>(null);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [showLeaveConfirm,  setShowLeaveConfirm]  = useState(false);

  if (!group) return null;

  const handleSaveName = () => {
    if (!groupName.trim()) return;
    updateGroup(params.id, { name: groupName.trim() });
    toast({ title: "Group name updated", duration: 2000 });
  };

  const handleAddMember = () => {
    const t = newMemberName.trim();
    if (!t) return;
    const isDup = groupMembers.some(m => m.name.trim().toLowerCase() === t.toLowerCase());
    if (isDup) {
      toast({ title: "This member already exists in this group.", duration: 2500, variant: "destructive" });
      return;
    }
    const res = addMemberToGroup(params.id, t);
    if (res === "EXISTS") {
      toast({ title: "This member already exists.", duration: 2500, variant: "destructive" });
      return;
    }
    setNewMemberName("");
    toast({ title: `${t} added`, duration: 2000 });
  };

  const handleRemoveMember = () => {
    if (!memberToRemove) return;
    const member = members[memberToRemove];
    const prevCount = group.memberIds.length;
    removeMemberFromGroup(params.id, memberToRemove);
    
    // Check if member was actually removed (store logic prevents removal of payers)
    const wasRemoved = !groups[params.id]?.memberIds.includes(memberToRemove);
    if (!wasRemoved) {
      toast({ 
        title: "Cannot remove member", 
        description: `${member?.name} is the payer for one or more expenses.`,
        duration: 3500, 
        variant: "destructive" 
      });
    } else {
      toast({ title: `${member?.name ?? "Member"} removed`, duration: 2000 });
    }
    
    setShowRemoveConfirm(false);
    setMemberToRemove(null);
  };

  const handleLeaveGroup = () => {
    updateGroup(params.id, { isArchived: true });
    setLocation("/home");
    toast({ title: "Group archived", duration: 2000 });
  };

  const currentMe = groupMembers.find((m) => m.id === meId);

  return (
    <Screen testId="page-group-settings">
      <AppHeader
        title="Group settings"
        subtitle={group.name}
        onBack={() => setLocation(`/group/${params.id}`)}
        large
      />

      <ScrollArea className="px-6 py-6 scroll-pb-safe space-y-8">

        {/* Group name */}
        <SettingsSection label="Group">
          <div className="px-5 py-5 space-y-3">
            <SectionLabel>Group name</SectionLabel>
            <div className="flex gap-2">
              <Input
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                className="flex-1 bg-muted/30 border-border/50 rounded-2xl text-body"
                data-testid="input-group-name"
              />
              <Button onClick={handleSaveName} className="rounded-2xl px-5 font-bold" data-testid="button-save-name">
                Save
              </Button>
            </div>
          </div>
        </SettingsSection>

        {/* Members */}
        <section className="space-y-3">
          <SectionLabel className="px-1">Members ({groupMembers.length})</SectionLabel>
          <div className="bg-card rounded-[28px] shadow-card border border-border/40 overflow-hidden">
            {groupMembers.map((m, i) => {
              const isMe = m.id === meId;
              return (
                <div key={m.id} className={`flex items-center gap-3 px-5 py-3.5 ${i < groupMembers.length - 1 ? "border-b border-border/30" : ""}`}>
                  <Avatar member={m} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-body font-semibold text-foreground truncate">{m.name}</p>
                    {isMe && <p className="text-caption text-primary font-semibold">You</p>}
                  </div>
                  {!isMe && groupMembers.length > 1 && (
                    <button
                      onClick={() => { setMemberToRemove(m.id); setShowRemoveConfirm(true); }}
                      className="w-8 h-8 rounded-xl bg-destructive/8 flex items-center justify-center hover:bg-destructive/15 transition-colors flex-shrink-0"
                      data-testid={`button-remove-${m.id}`}
                    >
                      <X size={14} className="text-destructive" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Add member */}
        <SettingsSection label="Add member">
          <div className="px-5 py-5 flex gap-2">
            <Input
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddMember()}
              placeholder="Member name…"
              className="flex-1 bg-muted/30 border-border/50 rounded-2xl"
              data-testid="input-new-member"
            />
            <Button onClick={handleAddMember} disabled={!newMemberName.trim()} className="rounded-2xl px-4 font-bold" data-testid="button-add-member">
              <UserPlus size={17} />
            </Button>
          </div>
        </SettingsSection>



        {/* Danger */}
        <section className="space-y-3 pb-4">
          <SectionLabel className="px-1">Danger zone</SectionLabel>
          <Button
            variant="outline"
            onClick={() => setShowLeaveConfirm(true)}
            className="w-full border-destructive/25 text-destructive hover:bg-destructive/5 rounded-2xl h-12 font-semibold"
            data-testid="button-leave-group"
          >
            <Archive size={16} className="mr-2" /> Archive group
          </Button>
        </section>
      </ScrollArea>

      {/* Remove member confirm */}
      <AnimatePresence>
        {showRemoveConfirm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/25 backdrop-blur-sm z-40" onClick={() => setShowRemoveConfirm(false)} />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 220 }}
              className="absolute bottom-0 left-0 right-0 bg-background rounded-t-[32px] p-6 pb-safe-sheet space-y-3 z-50"
            >
              <h2 className="text-title font-bold text-foreground">Remove member?</h2>
              <p className="text-body text-muted-foreground">
                Remove <span className="font-semibold">{members[memberToRemove ?? ""]?.name ?? ""}</span> from this group? Their expenses will remain.
              </p>
              <Button onClick={handleRemoveMember} variant="destructive" className="w-full h-12 rounded-2xl font-bold" data-testid="button-confirm-remove">
                Yes, remove them
              </Button>
              <Button variant="ghost" onClick={() => setShowRemoveConfirm(false)} className="w-full rounded-2xl">Cancel</Button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Leave / archive confirm */}
      <AnimatePresence>
        {showLeaveConfirm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/25 backdrop-blur-sm z-40" onClick={() => setShowLeaveConfirm(false)} />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 220 }}
              className="absolute bottom-0 left-0 right-0 bg-background rounded-t-[32px] p-6 pb-safe-sheet space-y-3 z-50"
            >
              <h2 className="text-title font-bold text-foreground">Archive group?</h2>
              <p className="text-body text-muted-foreground">
                "{group.name}" will be hidden from your home screen. All data is preserved.
              </p>
              <Button onClick={handleLeaveGroup} variant="destructive" className="w-full h-12 rounded-2xl font-bold" data-testid="button-confirm-leave">
                Yes, archive it
              </Button>
              <Button variant="ghost" onClick={() => setShowLeaveConfirm(false)} className="w-full rounded-2xl">Cancel</Button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </Screen>
  );
}
