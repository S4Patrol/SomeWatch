import React, { useState } from "react"
import { useAtom } from "jotai"
import { isAccountSettingsModalOpenAtom } from "@/app/(main)/_atoms/server-status.atoms"
import { Modal } from "@/components/ui/modal"
import { defineSchema, Field, Form } from "@/components/ui/form"
import { LuMail, LuLock, LuSave } from "react-icons/lu"
import { supabase } from "@/lib/supabase/client"
import { toast } from "sonner"
import { User as SupabaseUser } from "@supabase/supabase-js"

const changeEmailSchema = defineSchema(({ z }) => z.object({
    password: z.string().min(1, "Mevcut şifrenizi girmelisiniz"),
    newEmail: z.string().email("Geçerli bir e-posta adresi girin"),
}))

export function AccountSettingsModal({ supabaseUser }: { supabaseUser: SupabaseUser | null }) {
    const [open, setOpen] = useAtom(isAccountSettingsModalOpenAtom)
    const [isLoading, setIsLoading] = useState(false)

    if (!supabaseUser) return null;

    const handleUpdateEmailSubmit = async (data: any) => {
        setIsLoading(true)
        
        // Security check: Verify current password to prove identity
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: supabaseUser.email || "",
            password: data.password,
        })

        if (signInError) {
            setIsLoading(false)
            toast.error("Kimlik doğrulama başarısız", { description: "Girdiğiniz mevcut şifre yanlış." })
            return
        }

        // Update email
        const { error: updateError } = await supabase.auth.updateUser({
            email: data.newEmail
        })
        
        setIsLoading(false)

        if (updateError) {
            toast.error("Güncelleme başarısız", { description: updateError.message })
            return
        }

        toast.success("E-posta güncelleme talebi alındı", { 
            description: "Güvenliğiniz için hem eski hem de yeni e-posta adresinize bir onay bağlantısı gönderildi. Değişikliğin tamamlanması için lütfen bağlantıları onaylayın.",
            duration: 8000
        })
        setOpen(false)
    }

    return (
        <Modal
            open={open}
            onOpenChange={setOpen}
            title="Hesap Ayarları"
            description="Hesap bilgilerinizi ve e-posta adresinizi buradan güncelleyebilirsiniz."
            contentClass="max-w-md border border-white/10 shadow-2xl backdrop-blur-xl bg-gray-950/90"
        >
            <div className="mt-6">
                <Form
                    schema={changeEmailSchema}
                    onSubmit={handleUpdateEmailSubmit}
                    defaultValues={{ password: "", newEmail: "" }}
                >
                    <div className="space-y-6">
                        <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-2">
                            <p className="text-sm text-gray-400 font-medium">Mevcut E-Posta Adresiniz</p>
                            <p className="text-gray-100">{supabaseUser.email}</p>
                        </div>
                        
                        <div className="space-y-4 pt-2">
                            <h3 className="text-lg font-medium text-brand-300 flex items-center gap-2">
                                <LuMail /> E-Posta Değiştir
                            </h3>
                            
                            {/* Browser autofill trap */}
                            <input type="text" name="fakeusernameremembered" style={{display: 'none'}} />
                            <input type="password" name="fakepasswordremembered" style={{display: 'none'}} />
                            
                            <Field.Text
                                name="newEmail"
                                label="Yeni E-posta Adresi"
                                placeholder="yeni@email.com"
                                leftIcon={<LuMail className="text-gray-400" />}
                                autoComplete="off"
                                data-lpignore="true"
                            />
                            
                            <Field.Text
                                name="password"
                                label="Mevcut Şifreniz"
                                placeholder="Güvenlik için şifrenizi girin"
                                type="password"
                                leftIcon={<LuLock className="text-gray-400" />}
                                autoComplete="new-password"
                            />
                        </div>
                        
                        <div className="pt-4 border-t border-white/10">
                            <Field.Submit 
                                className="w-full bg-brand-600 hover:bg-brand-500 text-white font-semibold py-3 rounded-xl transition-all duration-300 shadow-lg shadow-brand-900/20"
                                loading={isLoading}
                            >
                                <span className="flex items-center justify-center gap-2">
                                    Değişiklikleri Kaydet <LuSave className="text-lg" />
                                </span>
                            </Field.Submit>
                        </div>
                    </div>
                </Form>
            </div>
        </Modal>
    )
}
