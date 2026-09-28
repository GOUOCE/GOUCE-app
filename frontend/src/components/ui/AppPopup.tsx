import React from 'react';
import { View, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Text, Button, Portal, useTheme } from 'react-native-paper';
import { AlertTriangle, CheckCircle2, Info, AlertCircle, X } from 'lucide-react-native';

export type PopupType = 'success' | 'error' | 'warning' | 'info';

export interface AppPopupProps {
  visible: boolean;
  type?: PopupType;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  onDismiss: () => void;
}

export function AppPopup({
  visible,
  type = 'info',
  title,
  message,
  confirmText = 'Entendido',
  cancelText,
  confirmColor,
  onConfirm,
  onCancel,
  onDismiss,
}: AppPopupProps) {
  const theme = useTheme();

  const renderIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={48} color="#2E7D32" />;
      case 'error':
        return <AlertTriangle size={48} color="#B00020" />;
      case 'warning':
        return <AlertCircle size={48} color="#E8912D" />;
      case 'info':
      default:
        return <Info size={48} color="#1D4E89" />;
    }
  };

  const getBadgeBg = () => {
    switch (type) {
      case 'success':
        return '#E8F5E9';
      case 'error':
        return '#FFEBEE';
      case 'warning':
        return '#FFF3E0';
      case 'info':
      default:
        return '#E3EFFF';
    }
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    } else {
      onDismiss();
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      onDismiss();
    }
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        transparent={true}
        animationType="fade"
        onRequestClose={onDismiss}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={onDismiss}
        >
          <TouchableOpacity
            style={styles.card}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Botão Fechar no Canto */}
            <TouchableOpacity style={styles.closeBtn} onPress={onDismiss}>
              <X size={20} color="#999" />
            </TouchableOpacity>

            {/* Ícone Estilizado */}
            <View style={[styles.iconBadge, { backgroundColor: getBadgeBg() }]}>
              {renderIcon()}
            </View>

            {/* Título e Mensagem */}
            <Text variant="titleLarge" style={styles.title}>{title}</Text>
            <Text variant="bodyMedium" style={styles.message}>{message}</Text>

            {/* Botões de Ação */}
            <View style={styles.buttonContainer}>
              {cancelText && (
                <Button
                  mode="outlined"
                  onPress={handleCancel}
                  style={styles.cancelBtn}
                  labelStyle={styles.cancelLabel}
                >
                  {cancelText}
                </Button>
              )}

              <Button
                mode="contained"
                onPress={handleConfirm}
                style={[
                  styles.confirmBtn,
                  confirmColor ? { backgroundColor: confirmColor } : { backgroundColor: theme.colors.primary }
                ]}
                contentStyle={styles.btnContent}
              >
                {confirmText}
              </Button>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
  },
  iconBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  title: {
    fontWeight: 'bold',
    color: '#1D1B20',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    color: '#49454F',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  buttonContainer: {
    width: '100%',
    gap: 10,
  },
  confirmBtn: {
    borderRadius: 10,
    width: '100%',
  },
  cancelBtn: {
    borderRadius: 10,
    borderColor: '#CAC4D0',
    width: '100%',
  },
  cancelLabel: {
    color: '#49454F',
  },
  btnContent: {
    height: 48,
  },
});
