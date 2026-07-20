import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import colors from '../theme/colors';

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange
}) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    const maxDisplayed = 5;

    if (totalPages <= maxDisplayed) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      if (currentPage <= 2) {
        end = 3;
      } else if (currentPage >= totalPages - 1) {
        start = totalPages - 2;
      }

      if (start > 2) {
        pages.push('...');
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages - 1) {
        pages.push('...');
      }

      pages.push(totalPages);
    }
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <View style={styles.container}>
      {/* Prev Button */}
      <TouchableOpacity
        style={[styles.btn, currentPage === 1 && styles.disabledBtn]}
        disabled={currentPage === 1}
        onPress={() => onPageChange(Math.max(currentPage - 1, 1))}
      >
        <Text style={[styles.btnText, currentPage === 1 && styles.disabledText]}>Prev</Text>
      </TouchableOpacity>

      {/* Pages */}
      {pageNumbers.map((page, index) => {
        if (page === '...') {
          return (
            <Text key={`ellipsis-${index}`} style={styles.ellipsis}>
              ...
            </Text>
          );
        }

        const isActive = page === currentPage;
        return (
          <TouchableOpacity
            key={page}
            onPress={() => onPageChange(page)}
            style={[
              styles.numberBtn,
              isActive ? styles.activeBtn : styles.inactiveBtn
            ]}
          >
            <Text style={[styles.numberText, isActive ? styles.activeText : styles.inactiveText]}>
              {page}
            </Text>
          </TouchableOpacity>
        );
      })}

      {/* Next Button */}
      <TouchableOpacity
        style={[styles.btn, currentPage === totalPages && styles.disabledBtn]}
        disabled={currentPage === totalPages}
        onPress={() => onPageChange(Math.min(currentPage + 1, totalPages))}
      >
        <Text style={[styles.btnText, currentPage === totalPages && styles.disabledText]}>Next</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 20,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  btn: {
    paddingHorizontal: 12,
    height: 36,
    backgroundColor: '#ffffff',
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
  disabledBtn: {
    opacity: 0.5,
  },
  disabledText: {
    color: colors.textMuted,
  },
  numberBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeBtn: {
    backgroundColor: colors.primary,
  },
  inactiveBtn: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.border,
  },
  numberText: {
    fontSize: 13,
    fontWeight: '600',
  },
  activeText: {
    color: '#ffffff',
  },
  inactiveText: {
    color: colors.primary,
  },
  ellipsis: {
    color: colors.textMuted,
    marginHorizontal: 4,
    fontSize: 14,
  },
});
